import requests
import os
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from pathlib import Path
import pdfplumber
import tempfile
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import logging
import json

logging.basicConfig(level=logging.INFO)

SCHEDULES_URL = "http://www.caecis.ugto.mx/caecis/pages/horarios.aspx"
current_dir = Path(__file__).resolve().parent

session = requests.Session()

#####################
# Models
#####################

class Day(str, Enum):
	MONDAY = "MONDAY"
	TUESDAY = "TUESDAY"
	WEDNESDAY = "WEDNESDAY"
	THURSDAY = "THURSDAY"
	FRIDAY = "FRIDAY"
	SATURDAY = "SATURDAY"


@dataclass
class TimeRange:
	from_: datetime
	to: datetime


@dataclass
class Schedule:
	day: Day
	timeRange: TimeRange


@dataclass
class Professor:
	names: str
	last_names: str
	honorific: str


@dataclass
class Class:
	uda: str
	classroom: str
	professor: Professor
	schedules: list[Schedule] = field(default_factory=list)


@dataclass
class Course:
	name: str
	classes: list[Class]
	updatedAt: datetime | None


#####################
# HTML Scraping
#####################

def get_pdf_links():
	res = session.get(SCHEDULES_URL, timeout=10)
	res.raise_for_status()

	soup = BeautifulSoup(res.text, "html.parser")

	title = soup.find(string=lambda t: t and "Sede Salamanca Enero" in t)

	if not title:
		raise Exception("No se encontró Salamanca")

	container = title.find_parent("td")
	table = container.find("table")

	anchors = []

	for a in table.find_all("a", href=True):
		href = a["href"]

		if href.lower().endswith(".pdf"):
			anchors.append({
				"name": a.text.strip(),
				"href": urljoin(SCHEDULES_URL, href)
			})

	return anchors


#####################
# Utils
#####################

def clean(text):
	return " ".join(str(text).split())


def safe_parse_time(value):
	try:
		return datetime.strptime(value, "%H:%M")
	except:
		return None


def extract_days(headers):
	mapping = {}

	for i, h in enumerate(headers):
		if not h:
			continue

		h = h.upper()

		if "LUN" in h:
			mapping[Day.MONDAY] = (i, i + 1)
		elif "MAR" in h:
			mapping[Day.TUESDAY] = (i, i + 1)
		elif "MIÉ" in h or "MIE" in h:
			mapping[Day.WEDNESDAY] = (i, i + 1)
		elif "JUE" in h:
			mapping[Day.THURSDAY] = (i, i + 1)
		elif "VIE" in h:
			mapping[Day.FRIDAY] = (i, i + 1)
		elif "SÁB" in h or "SAB" in h:
			mapping[Day.SATURDAY] = (i, i + 1)

	return mapping


def format_professor(name):
	name = clean(name)

	parts = name.split(",")

	name_parts = parts[0].split()

	last_names = " ".join(name_parts[:2]).title()
	names = " ".join(name_parts[2:]).title()

	honorific = parts[1].strip() if len(parts) > 1 else ""

	return Professor(names=names, last_names=last_names, honorific=honorific)


#####################
# Table parsing
#####################

def parse_table(table):
	if not table or len(table) < 2:
		return []

	headers = [clean(h).upper() if h else "" for h in table[0]]
	rows = table[1:]

	try:
		uda_idx = headers.index("UDA")
		aula_idx = headers.index("AULA")
		prof_idx = headers.index("PROFESOR")
	except ValueError:
		return []

	days_map = extract_days(headers)

	grouped = {}

	for row in rows:
		uda = clean(row[uda_idx])
		aula = clean(row[aula_idx])
		prof_raw = clean(row[prof_idx])

		if not uda or not aula:
			continue

		prof = format_professor(prof_raw)

		key = (uda, aula, prof_raw)

		if key not in grouped:
			grouped[key] = Class(
				uda=uda,
				classroom=aula,
				professor=prof,
				schedules=[]
			)

		for day, (start_i, end_i) in days_map.items():
			start = safe_parse_time(row[start_i])
			end = safe_parse_time(row[end_i])

			if start and end:
				grouped[key].schedules.append(
					Schedule(day=day, timeRange=TimeRange(start, end))
				)

	return list(grouped.values())


#####################
# PDF parsing
#####################

def parse_pdf(url, name):
	logging.info(f"Downloading {name}")

	res = session.get(url, timeout=20)
	res.raise_for_status()

	with tempfile.NamedTemporaryFile(suffix=".pdf") as tmp:
		tmp.write(res.content)
		tmp.flush()

		classes = []

		with pdfplumber.open(tmp.name) as pdf:
			for page in pdf.pages:
				tables = page.extract_tables()

				if not tables:
					continue

				for t in tables:
					try:
						classes.extend(parse_table(t))
					except Exception as e:
						logging.warning(f"Table parse failed: {e}")

		return Course(name=name, classes=classes, updatedAt=None)


#####################
# Flatten (JSON OPTIMIZADO)
#####################

def to_flat(courses):
	rows = []

	for course in courses:
		for cls in course.classes:
			for sched in cls.schedules:
				rows.append({
					"course": course.name,
					"uda": cls.uda,
					"classroom": cls.classroom,
					"day": sched.day.value,
					"start": sched.timeRange.from_.strftime("%H:%M"),
					"end": sched.timeRange.to.strftime("%H:%M"),
					"professor": f"{cls.professor.honorific} {cls.professor.names} {cls.professor.last_names}".strip()
				})

	return rows


#####################
# Main
#####################

def run():
	anchors = get_pdf_links()
	courses = []

	for a in anchors:
		try:
			course = parse_pdf(a["href"], a["name"])
			courses.append(course)
		except Exception as e:
			logging.error(f"Failed {a['name']}: {e}")

	return courses


if __name__ == "__main__":
	data = run()
	print(f"Parsed {len(data)} courses")

	flat = to_flat(data)

	with open(os.path.join(current_dir, "..", "frontend", "src", "data.json"), "w") as f:
		json.dump(flat, f, separators=(",", ":"))