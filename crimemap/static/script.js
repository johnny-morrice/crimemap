var datamap;
// crimeReports is global variable to enable popupTemplate.
var crimeReports = {};

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

	var crimeFills = {
		defaultFill: '#ccc',
		low: 'rgb(243, 218, 10)',
		med: 'rgb(235, 141, 0)',
		high: 'rgb(242, 35, 26)'
	};

	datamap = new Datamap({
		element: container,
		responsive: true,
		aspectRatio: 0.34,
		setProjection: projection,
		fills: crimeFills,
		geographyConfig: {
			highlightFillColor: function(geo) {
				switch (geo.fillKey)
				{
					case 'low':
						return 'rgb(162, 144, 10)';
					case 'med':
						return 'rgb(152, 81, 5)';
					case 'high':
						return 'rgb(157, 19, 14)';
					default:
						return 'rgb(44, 44, 44)';
				}
			},
			highlightBorderColor: '#fff',
			popupTemplate: function(geo, data) {
				var name = geo.properties.name;
				var id = geo.id;
				var count = crimeReports[id];

				if (count == null) {
					return '<div class="hoverinfo"><strong>' + name + '</strong></div>';
				}

				return '<div class="hoverinfo"><strong>' + name + ':</strong> ' + count + '</div>';
			},
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

		// No idea what EL is supposed to be.
		var normal = crimes.filter(function (c) { return c['country'] != 'EL' });
		normal = normalize(crimes, 'GB', ['UKM', 'UKN', 'UKC-L']);
		normal = normalize(normal, 'FR', ['FR', 'FX']);

		var bands = new CrimeBands(normal);

		var choropleth = {};
		crimeReports = {};
		normal.forEach(function(c, i, a) {
			var key = alphaTwo2Three(c['country']);
			if (key != '') {
				var count = c['count'];
				var band = bands.find(count);

				var fill = {
					fillKey: band
				};

				choropleth[key] = fill;
				crimeReports[key] = count;
			}
		});

		datamap.updateChoropleth(choropleth, {reset: true});
	});
}

// Perhaps this normalization should be done server side.
function normalize(crimes, normalName, otherNames) {
	var isOther = function(c) {
		return otherNames.includes(c['country']);
	};

	var normal = crimes.filter(function(c, i, a) {
		return !isOther(c);
	});

	var others = crimes.filter(isOther);

	var reportCount = 0;
	others.forEach(function(c, i, a) {
		reportCount += c['count'];
	});

	if (reportCount > 0) {
		var normalized = {
			country: normalName,
			count: reportCount
		};

		normal.push(normalized);
	}

	return normal;
}

// Perhaps the alpha2 to alpha3 conversion should be done server side.
// Incomplete ISO alpha2 to alpha3 converter just for this demo.
var _codeMap = null;
function alphaTwo2Three(alpha2) {
	if (_codeMap == null) {
		_codeMap = {};
		_codeMap['GB'] = 'GBR';
		_codeMap['AT'] = 'AUT';
		_codeMap['BE'] = 'BEL';
		_codeMap['BG'] = 'BGR';
		_codeMap['CH'] = 'CHE';
		_codeMap['CY'] = 'CYP';
		_codeMap['CZ'] = 'CZE';
		_codeMap['DE'] = 'DEU';
		_codeMap['DK'] = 'DNK';
		_codeMap['EE'] = 'EST';
		// _codeMap['EL'] = '???';
		_codeMap['ES'] = 'ESP';
		_codeMap['FI'] = 'FIN';
		_codeMap['FR'] = 'FRA';
		_codeMap['HR'] = 'HRV';
		_codeMap['HU'] = 'HUN';
		_codeMap['IE'] = 'IRL';
		_codeMap['IS'] = 'ISL';
		_codeMap['LI'] = 'LIE';
		_codeMap['LT'] = 'LTU';
		_codeMap['LU'] = 'LUX';
		_codeMap['LV'] = 'LVA';
		_codeMap['MK'] = 'MKD';
		_codeMap['MT'] = 'MLT';
		_codeMap['NL'] = 'NLD';
		_codeMap['NO'] = 'NOR';
		_codeMap['PL'] = 'POL';
		_codeMap['PT'] = 'PRT';
		_codeMap['RO'] = 'ROU';
		_codeMap['RS'] = 'SRB';
		_codeMap['SE'] = 'SWE';
		_codeMap['SI'] = 'SVN';
		_codeMap['SK'] = 'SVK';
		_codeMap['TR'] = 'TUR';
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

	// Default sort is not numeric.
	this.counts.sort(function(a, b) {
		return a - b;
	});

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
