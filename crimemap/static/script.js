$(document).ready(function() {
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

});
