var datamap;

$(document).ready(function() {
	drawMap();
	loadDateRange();
});

function drawMap() {
	// Don't use JQuery to grab Datamap container in order to minimize
	// inter-dependency glitches.
	var container = document.getElementById('visualisation-container');

	// Position of various countries to enable experimentation.
	var france = [2.2137, 46.2276];
	var poland = [19.1451, 51.9194];

	var center = poland;

	var projection = function(element) {
		var proj = d3.geo.mercator()
			.center(center)
			.scale(400)
			.translate([element.offsetWidth / 2, element.offsetHeight / 2]);
		var path = d3.geo.path()
			.projection(proj);

		return {path: path, projection: proj}
	}

	datamap = new Datamap({
		element: container,
		responsive: true,
		aspectRatio: 0.34,
		setProjection: projection,
		fills: {
			defaultFill: '#ccc',
			low: '#0c0',
			med: '#ff0',
			high: '#f00'
		}
	});
}

function loadDateRange() {
	$.getJSON('/api/dates', null, function(dates, status, xhr) {
		if (status != 'success') {
			throw badStatusError(status);
		}

		if (dates.length == 0) {
			throw "Unexpected 0 length date array";
		}

		initYearSelector(dates);
		displayDateRange(dates);
	});
}

function displayDateRange(dates) {
	var heading = $('#heading');

	var subheading = document.createElement("h2");
	subheading.textContent = dates[0] + " to " + dates[dates.length - 1];

	heading.append(subheading);
}

function initYearSelector(dates) {
	var select = $('#year-selector');

	var addOption = function(d) {
		var option = document.createElement('option');
		option.setAttribute('value', d);
		option.textContent = d;

		select.append(option);
	};

	dates.forEach(function(d, i, a) {
		addOption(d);
	});

	var startYear = dates[0];
	select.value = startYear;

	changeYear(startYear);
}

function selectYearChanged(event) {
	changeYear(event.target.value);
}

function changeYear(year) {
	$.getJSON('/api/dates/' + year, function(crimes, status, xhr) {
		if (status != 'success') {
			throw badStatusError(status);
		}

		var choropleth = {};

		var bands = new CrimeBands(crimes);

		// Normalize UK entries.
		var isUk = function(c) {
			var ctry = c['country']
			return (ctry == 'UKM' || ctry == 'UKN' || ctry == 'UKC-L');
		};

		var normal = crimes.filter(function(c, i, a) {
			return !isUk(c);
		});
		var uks = crimes.filter(isUk);
		var ukCount = 0;
		uks.forEach(function(c, i, a) {
			ukCount += c['count'];
		});

		if (ukCount > 0) {
			var uk = {
				country: 'GB',
				count: ukCount
			};

			normal.push(uk);
		}

		normal.forEach(function(c, i, a) {
			var key = alphaTwo2Three(c['country']);
			if (key != '') {
				var fill = {
					fillKey: bands.find(c['count'])
				};

				choropleth[key] = fill;
			}
		});

		datamap.updateChoropleth(choropleth);
	});
}

// Incomplete ISO alpha2 to alpha3 converter just for this demo.
var _codeMap = null;
function alphaTwo2Three(alpha2) {
	if (_codeMap == null) {
		_codeMap = {};
		_codeMap['GB'] = 'GBR'
		_codeMap['AT'] = 'AUT'
		_codeMap['BE'] = 'BEL'
		_codeMap['BG'] = 'BGR'
		_codeMap['CH'] = 'CHE'
		_codeMap['CY'] = 'CYP'
		_codeMap['CZ'] = 'CZE'
		_codeMap['DE'] = 'DEU'
		_codeMap['EE'] = 'EST'
		// _codeMap['EL'] = '???'
		_codeMap['ES'] = 'ESP'
		_codeMap['FI'] = 'FIN'
		_codeMap['FR'] = 'FRA'
		// _codeMap['FX'] = '???'
		_codeMap['HR'] = 'HRV'
		_codeMap['HU'] = 'HUN'
		_codeMap['IE'] = 'IRL'
		_codeMap['IS'] = 'ISL'
		_codeMap['LI'] = 'LIE'
		_codeMap['LT'] = 'LTU'
		_codeMap['LU'] = 'LUX'
		_codeMap['LV'] = 'LVA'
		_codeMap['MK'] = 'MKD'
		_codeMap['MT'] = 'MLT'
		_codeMap['NL'] = 'NLD'
		_codeMap['NO'] = 'NOR'
		_codeMap['PL'] = 'POL'
		_codeMap['PT'] = 'PRT'
		_codeMap['RO'] = 'ROU'
		_codeMap['RS'] = 'SRB'
		_codeMap['SE'] = 'SWE'
		_codeMap['SI'] = 'SVN'
		_codeMap['SK'] = 'SVK'
		_codeMap['TR'] = 'TUR'
	}

	return _codeMap[alpha2];
}

function CrimeBands(crimes) {
	this.crimes = crimes;
	this.medMin = 0;
	this.highMin = 0;

	this.counts = this.crimes.map(function(c, i, a) {
		return c['count'];
	});

	this.counts.sort();

	// Prepare trivial cases first
	if (this.counts.length == 1) {
		this.highMin = this.counts[0];
	} else if (this.counts.length == 2) {
		this.medMin = this.counts[0];
		this.highMin = this.counts[1];
	} else {
		var range = this.counts[this.counts.length - 1] - this.counts[0];
		this.medMin = range * (1.0 / 3.0);
		this.highMin = range * (2.0 / 3.0);
	}

	this.find = function(count) {
		if (count >= this.highMin) {
			return 'high';
		} else if (count >= this.medMin) {
			return 'med';
		} else {
			return 'low';
		}
	}
}

function badStatusError(status) {
	return 'Bad status: ' + status;
}
