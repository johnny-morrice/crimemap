import os
import sqlite3
import click
import pandas as pd
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
	return '[]'

@app.route('/api/countries')
def countries():
	return '[]'

@app.route('/api/countries/<country>')
def country(country):
	return '{}'

@app.route('/api/countries/<country>/<date>')
def crountry_date(country, date):
	return '0'

@app.route('/')
def index():
	return 'Welcome'

def load_crimes(crimes):
	pass

@app.cli.command(help='Read data file and init database')
@click.argument('filepath', nargs=1)
def initdb(filepath):
	init_db_schema()
	populate_db(filepath)
	click.echo('Should read ' + filepath)

def init_db_schema():
	db = get_db()
	with app.open_resource('schema.sql', mode='r') as f:
		db.cursor().executescript(f.read())
	db.commit()

def populate_db(filepath):
	db = get_db()
	with app.open_resource(filepath, mode='r') as tsv:
		crimes = pd.read_csv(filepath)
		print(crimes)
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
