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
import hashlib
import unicodedata

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
	subject: str
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

def normalize(txt):
	txt = txt.strip().lower()
	txt = unicodedata.normalize('NFKD', txt)
	txt = "".join(c for c in txt if not unicodedata.combining(c))
	return txt

def generate_hash(txt):
	txt = normalize(txt)
	return hashlib.sha256(txt.encode('utf-8')).hexdigest()

def subject_id(course_name, subject):
	base = f"{course_name}|{subject}"
	return generate_hash(base)

def professor_id(professor):
	base = f"{professor.honorific}|{professor.names}|{professor.last_names}"
	return generate_hash(base)

#####################
# Table parsing
#####################

def parse_table(table):
	if not table or len(table) < 2:
		return []

	headers = [clean(h).upper() if h else "" for h in table[0]]
	rows = table[1:]

	try:
		subject_idx = headers.index("UDA")
		room_idx = headers.index("AULA")
		prof_idx = headers.index("PROFESOR")
	except ValueError:
		return []

	days_map = extract_days(headers)

	grouped = {}

	for row in rows:
		subject = clean(row[subject_idx])
		room = clean(row[room_idx])
		prof_raw = clean(row[prof_idx])

		if not subject or not room:
			continue

		prof = format_professor(prof_raw)

		key = (subject, room, prof_raw)

		if key not in grouped:
			grouped[key] = Class(
				subject=subject,
				classroom=room,
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
# Structured Data
#####################

def to_structured(courses):
	subjects = {}
	professors = {}
	classes = []

	for course in courses:
		for cls in course.classes:
			mid = subject_id(course.name, cls.subject)
			pid = professor_id(cls.professor)

			subjects[mid] = {"name": course.name, "subjects": cls.subject}
			professors[pid] = {
				"name": f"{cls.professor.names} {cls.professor.last_names}",
				"honorific": cls.professor.honorific
			}

			for sched in cls.schedules:
				classes.append({
					"subject_id": mid,
					"professor_id": pid,
					"classroom": cls.classroom,
					"day": sched.day.value,
					"start": sched.timeRange.from_.strftime("%H:%M"),
					"end": sched.timeRange.to.strftime("%H:%M")
				})

	return {
		"subjects": subjects,
		"professors": professors,
		"classes": classes
	}


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

	structured = to_structured(data)

	with open(os.path.join(current_dir, "..", "frontend", "src", "data.json"), "w", encoding="utf-8") as f:
		json.dump(structured, f, indent=2, ensure_ascii=False)