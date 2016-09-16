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
			.scale(800)
			.translate([element.offsetWidth / 2, element.offsetHeight / 2]);
		var path = d3.geo.path()
			.projection(proj);

		return {path: path, projection: proj}
	}

	var map = new Datamap({
		element: container,
		responsive: true,
		aspectRatio: 0.37,
		setProjection: projection
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

	select.value = dates[0];
}

function badStatusError(status) {
	return 'Bad status: ' + status;
}
