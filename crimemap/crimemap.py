from flask import Flask
app = Flask(__name__)

@app.route('/api/dates')
def dates():
	return '[]'

@app.route('/api/countries')
def countries():
	return '[]'

@app.route('/api/countries/<country>')
def country():
	return '{}'

@app.route('/api/countries/<country>/<date>')
def crountry_date():
	return '0'

@app.route('/')
def index():
	return 'Welcome'
