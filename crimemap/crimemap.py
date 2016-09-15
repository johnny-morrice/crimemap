import click
from flask import Flask

app = Flask(__name__)

@app.cli.command(help='Read data file and init database')
@click.argument('filepath', nargs=1)
def initdb(filepath):
	click.echo('Should read ' + filepath)

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
