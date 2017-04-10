var raw = require('../lib/raw').raw;

(function(){

	var points = raw.models.points();

	var chart = raw.chart()
		.title('Scatter Plot')
		.description(
            "散点图是一种使用笛卡尔坐标显示一组数据的两个变量值的数学图. 数据显示为点的集合, 每个具有确定水平轴上的位置的一个变量的值和确定垂直轴上的位置的另一个变量的值.")
		.thumbnail("imgs/scatterPlot.png")
	    .category('Dispersion')
		.model(points)

	var width = chart.number()
		.title("Width")
		.defaultValue(( $('.container').width() - 40 ) * .75)
		.fitToWidth(false)

	var height = chart.number()
		.title("Height")
		.defaultValue(500)

	var maxRadius = chart.number()
		.title("max radius")
		.defaultValue(20)

	var useZero = chart.checkbox()
		.title("set origin at (0,0)")
		.defaultValue(false)

	var colors = chart.color()
		 .title("Color scale")

	var showPoints = chart.checkbox()
		.title("show points")
		.defaultValue(true)

	chart.draw(function (selection, data){

		// Retrieving dimensions from model
		var x = points.dimensions().get('x'),
			y = points.dimensions().get('y');

		var g = selection
			.attr("width", +width() )
			.attr("height", +height() )
			.append("g")

		var marginLeft = d3.max([maxRadius(),(d3.max(data, function (d) { return (Math.log(d.y) / 2.302585092994046) + 1; }) * 9)]),
			marginBottom = 20,
			w = width() - marginLeft,
			h = height() - marginBottom;

		var xExtent = !useZero()? d3.extent(data, function (d){ return d.x; }) : [0, d3.max(data, function (d){ return d.x; })],
			yExtent = !useZero()? d3.extent(data, function (d){ return d.y; }) : [0, d3.max(data, function (d){ return d.y; })];

		var xScale = x.type() == "Date"
				? d3.time.scale().range([marginLeft,width()-maxRadius()]).domain(xExtent)
				: d3.scale.linear().range([marginLeft,width()-maxRadius()]).domain(xExtent),
			yScale = y.type() == "Date"
				? d3.time.scale().range([h-maxRadius(), maxRadius()]).domain(yExtent)
				: d3.scale.linear().range([h-maxRadius(), maxRadius()]).domain(yExtent),
			sizeScale = d3.scale.linear().range([1, Math.pow(+maxRadius(),2)*Math.PI]).domain([0, d3.max(data, function (d){ return d.size; })]),
			xAxis = d3.svg.axis().scale(xScale).tickSize(-h+maxRadius()*2).orient("bottom")//.tickSubdivide(true),
    		yAxis = d3.svg.axis().scale(yScale).ticks(10).tickSize(-w+maxRadius()).orient("left");


        g.append("g")
            .attr("class", "x axis")
            .style("stroke-width", "1px")
        	.style("font-size","10px")
        	.style("font-family","Arial, Helvetica")
            .attr("transform", "translate(" + 0 + "," + (h-maxRadius()) + ")")
            .call(xAxis);

      	g.append("g")
            .attr("class", "y axis")
            .style("stroke-width", "1px")
            .style("font-size","10px")
			.style("font-family","Arial, Helvetica")
            .attr("transform", "translate(" + marginLeft + "," + 0 + ")")
            .call(yAxis);

        d3.selectAll(".y.axis line, .x.axis line, .y.axis path, .x.axis path")
         	.style("shape-rendering","crispEdges")
         	.style("fill","none")
         	.style("stroke","#ccc")

		var circle = g.selectAll("g.circle")
			.data(data)
			.enter().append("g")
			.attr("class","circle")

		var point = g.selectAll("g.point")
			.data(data)
			.enter().append("g")
			.attr("class","point")

		colors.domain(data, function(d){ return d.color; });

    	circle.append("circle")
            .style("fill", function(d) { return colors() ? colors()(d.color) : "#eeeeee"; })
            .style("fill-opacity", .9)
    	    .attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; })
    	    .attr("r", function (d){ return Math.sqrt(sizeScale(d.size)/Math.PI); });

    	point.append("circle")
            .filter(function(){ return showPoints(); })
            .style("fill", "#000")
            .attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; })
            .attr("r", 1);

    	circle.append("text")
    	    .attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; })
    		.attr("text-anchor", "middle")
    		.style("font-size","10px")
    		.attr("dy", 15)
    		.style("font-family","Arial, Helvetica")
    	  	.text(function (d){ return d.label? d.label.join(", ") : ""; });

	})

})();
