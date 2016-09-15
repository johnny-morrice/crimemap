import os
import sqlite3
import click
import pandas as pd
import json
from flask import Flask
from flask import g

app = Flask(__name__)
app.config.from_object(__name__)

app.config.update(dict(
	DATABASE=os.path.join(app.root_path, 'crimemap.db'),
	SECRET_KEY='development key',
	USERNAME='admin',
	PASSWORD='default'
))
app.config.from_envvar('CRIMEMAP_SETTINGS', silent=True)

@app.route('/api/dates')
def dates():
	dates = get_dates()

	return json.dumps(dates)

@app.route('/api/countries')
def countries():
	countries = get_countries()

	return json.dumps(countries)

@app.route('/api/countries/<country>')
def country(country):
	all_crimes = get_all(country)

	return json.dumps(all_crimes)

@app.route('/api/countries/<country>/<year>')
def crountry_date(country, year):
	crimes = get_reports(country, year)

	return json.dumps(crimes)

@app.route('/')
def index():
	return 'Welcome'

def get_reports(country, year):
	query = ('select crimes.count '
			'from crimes '
			'join countries '
			'on crimes.location = countries.id '
			'join years '
			'on crimes.yeardate = years.year'
			'where countries.code = ? '
			'and where years.year = ?')

	db = get_db()

	cur = db.execute(query, [country, year])
	entries = cur.fetchall()

	crimes = map(lambda r: r['count'], entries)

	return list(crimes)


def get_all(country):
	query = ('select crimes.count '
			'from crimes join countries '
			'on crimes.location = countries.id '
			'where countries.code = ?')

	db = get_db()

	cur = db.execute(query, [country])
	entries = cur.fetchall()

	crimes = map(lambda r: r['count'], entries)

	return list(crimes)

def get_countries():
	db = get_db()

	cur = db.execute('select code from countries order by code desc')
	entries = cur.fetchall()

	countries = map(lambda r: r['code'], entries)

	return list(countries)

def get_dates():
	db = get_db()

	cur = db.execute('select year from years order by year desc')
	entries = cur.fetchall()

	years = map(lambda r: r['year'], entries)

	return list(years)

def save_crimes(crimes):
	"""Save the crimes in the database."""
	countries = []
	for countrycode in crimes[r'unit,geo\time']:
		country_id = save_country(countrycode)
		# len countries = id?
		countries.append(country_id)

	first = True
	for year in crimes:
		# Cannot seem to slice crimes to ignore 0th column,
		# so using flag to ignore.
		if first:
			first = False
			continue

		crime_reports = zip(countries, crimes[year])
		save_crime_report(year, crime_reports)

def save_country(countrycode):
	country = countrycode.split(',')[1]

	db = get_db()
	cur = db.cursor()

	cur.execute('insert into countries (code) values (?)', [country])

	db.commit()

	row_id = cur.lastrowid

	return row_id

def save_crime_report(year, crime_reports):
	date = int(year)
	db = get_db()
	db.execute('insert into years (year) values (?)', [date])
	db.commit()

	for (country, report_count) in crime_reports:
		# ':' indicates no data.
		if report_count == ':':
			continue

		count = int(report_count)

		db.execute('insert into crimes (count,location,yeardate) values (?,?,?)',
			[count, country, date])

def parse_crimes(filepath):
	return pd.read_csv(filepath, delim_whitespace=True)

@app.cli.command(help='Read data file and init database')
@click.argument('filepath', nargs=1)
def initdb(filepath):
	init_db_schema()
	populate_db(filepath)

def init_db_schema():
	db = get_db()
	with app.open_resource('schema.sql', mode='r') as f:
		db.cursor().executescript(f.read())
	db.commit()

def populate_db(filepath):
	db = get_db()
	with app.open_resource(filepath, mode='r') as tsv:
		crimes = parse_crimes(filepath)
		save_crimes(crimes)
	db.commit()

def connect_db():
    """Connects to the database specified in Flask app config."""
    rv = sqlite3.connect(app.config['DATABASE'])
    rv.row_factory = sqlite3.Row
    return rv

def get_db():
    """Opens a new database connection if there is none yet for the
    current application context.
    """
    if not hasattr(g, 'sqlite_db'):
        g.sqlite_db = connect_db()
    return g.sqlite_db

@app.teardown_appcontext
def close_db(error):
    """Closes the database again at the end of the request."""
    if hasattr(g, 'sqlite_db'):
        g.sqlite_db.close()
