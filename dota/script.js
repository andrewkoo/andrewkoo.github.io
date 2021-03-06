// Constants
var margin = {top: 50, right: 50, bottom: 50, left: 50},

    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom,

    csv = [], // Nested data (index by year)
    currData = [],
    sums = [],
    iteration = 0,
    largestIteration = [true, true, true, true, true, true],
    caller = -1; // Increment and decrement flag
var parseDate = d3.time.format("%m/%d/%y").parse;


function updateDesc() {
    var descs = ["The first edition of <b>The International</b> was hosted by Valve in 2011. With an unprecedented prize pool of $1.6 million, it became the largest prize pool in electronic sports history.",
                 "In 2012, more independent tournaments arose globally and in the online scene. <b>55 tournaments</b> are represented here with prize pools ranging from $1000 to $50,000. Valve matched the previous year's International prize at $1.6 million.",
                 "The scene continued to grow through 2013, and the release of compendium sales allowed gamers to crowdfund an additional $1.3 million to be added to Valve's $1.6 million contribution to the International 3, bringing the total player winnings to nearly <b>$2.9 million</b>.",
                 "There were over <b>158 tournaments</b> in 2014, with the largest being the International 4 at a prize pool of over $10 million. For context, this exceeded the prizes at the Super Bowl, the Masters golf tournament and the Tour de France.",
                 "With half of 2015 remaining, the growth of electronic sports is evident. The <b>International 5</b> has already exceeded the past year's prize with months of crowd-funding to go. In addition, the <b>Asia Championships</b> emerged as a major tournament with an offering of over $3 million.",
                 "The same tournaments are displayed on a <b>logarithmic scale</b>, where the relative increases in prize pools and number of tournaments are more visible.",
                 "Annual tournament winnings are totalled here to give a bigger picture of industry. The latest datapoint in this set occurs in June 2015, so we can expect 2015 winnings to rise even higher in time."],
        descWidths = [225, 125, 225, 225, 225, 225]

    d3.select(".desc").style("width", descWidths[iteration] + "px");

    d3.select(".desc")
        .html(descs[iteration])
        .style("opacity", 0)
        .transition()
        .duration(750)
        .style("opacity", 1);
}
updateDesc();

// Tooltip
var tooltip = d3.select("body")
	.append("div")
	.style("position", "absolute")
	.style("z-index", "10")
	.style("visibility", "hidden")
    .attr("class", "tooltip");
function updateTooltip(d) {
    return (
        tooltip
            .html("<b>"+d.Tournament+"</b> <br> Prize Pool: $" + d.Prize.toString()
                 + "<br> Date: " + d.Start)
            .style("visibility", "visible")
    );
}

// Axes and Color Scales
var yLog = d3.scale.log()
    .range([height, 0]);
var yLinear = d3.scale.linear()
    .range([height, 0]);
var y = yLinear; // Container variable for easier use later
var x = d3.time.scale()
    .range([0, width]);
var r = d3.scale.linear()
    .range([8, 40]);
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(5)
    .tickFormat(d3.time.format("%m/%Y"));
var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickFormat(d3.format(".2s"));

// Initialize Tracking Bar
var labels = ["2011", "2012", "2013", "2014", "2015", "Log", "Totals"];
var trackScale = d3.scale.linear()
    .range([0, width-margin.left])
    .domain([0, 7]);
var trackingBar = d3.svg.axis()
    .scale(trackScale)
    .orient("bottom")
    .tickFormat(function(i) { return labels[i]; });
var tracker = d3.select(".container").append("svg")
    .attr("width", width+margin.left)
    .attr("height", 30)
tracker.append("g")
    .attr("transform", "translate(" + (margin.left+margin.left) + ", 10 )")
    .attr("class", "trackingAxis")
    .call(trackingBar);
tracker.selectAll("text")
    .attr("transform", "translate(" + (width / 7)/2 + ", 0 )");
tracker.append("rect")
    .attr("x", margin.left+margin.left)
    .attr("y", 8)
    .attr("width", trackScale(1))
    .attr("height", 5)
    .attr("fill", "#400")
    .attr("opacity", .75);

// Initialize SVG
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Gradient
var gradient = svg
    .append("linearGradient")
    .attr("y1", height)
    .attr("y2", 0)
    .attr("x1", "0")
    .attr("x2", width)
    .attr("id", "gradient")
    .attr("gradientUnits", "userSpaceOnUse");
gradient
    .append("stop")
    .attr("offset", "0")
    .attr("stop-color", "#0569ab");
gradient
    .append("stop")
    .attr("offset", "1")
    .attr("stop-color", "#b00");

// Load data
d3.csv("data.csv", function(data) {
    data.forEach(function(d) {
        // "Tournament","Start","End","Location","Prize","Winner","Runner-Up"
        d.Date = parseDate(d.Start);
        d.Year = d.Date.getFullYear();
        d.Prize = Math.round(d.Prize); // Convert string to int
    });
    // Clean data: filter qualifier tournaments
    function filterByPrize(obj) {
        if (obj.Prize == "0") {
            return false;
        } else {
            return true;
        }
    }
    data = data.filter(filterByPrize);
    // Group data by year
    csv = d3.nest()
        .key(function(d) { return d.Year; })
        .sortKeys(d3.ascending)
        .entries(data);

    // Calculate sums and years
    sums = csv.map(function(arr, i) {
        sum = 0;
        for (var i = 0; i < arr.values.length; i++) {
            sum += arr.values[i].Prize;
        }
        return {sum: sum, year: d3.time.format("%Y").parse(arr.key)};
    });


    // Start program on first year
    currData = csv[iteration].values;

    // Axes
    yLinear.domain([0, d3.max(currData, function(d) { return d.Prize; })]).nice();
    yLog.domain([d3.min(currData, function(d) { return d.Prize; }), d3.max(currData, function(d) { return d.Prize; })]).nice();
    x.domain([d3.time.format("%m/%d/%y").parse("01/01/11"), d3.max(currData, function(d) { return d.Date; })]).nice();
    r.domain([0, d3.max(currData, function(d) { return d.Prize; })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "translate(0," + "-40" + ")")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Dollars ($)");

    // Scatterplot
    svg.selectAll( "curr dot" )
        .data(currData)
        .enter().append("circle")
        .attr("class", "curr dot" )
        .attr("r", function(d) { return r(d.Prize); })
        .attr("cx", function(d) { return x(d.Date); })
        .attr("cy", function(d) { return y(d.Prize); })
        .attr("fill", "url(#gradient)")
        .on("mouseover", function(d) { updateTooltip(d); } )
        .on("mousemove", function(){return tooltip.style("top", (event.pageY-20)+"px").style("left",(event.pageX+15)+"px");})
        .on("mouseout", function(){return tooltip.style("visibility", "hidden");});
});

function updateDots() {
    if (iteration == 5) { // Log
        if (caller == 0) {
            svg.selectAll(".bar")
                .transition()
                .duration(750)
                .attr("height", 0)
                .attr("y", height );
            xAxis.tickFormat(d3.time.format("%m/%Y"));
        }
        y = yLog;
        yAxis.scale(y).tickValues([200, 2000, 20000, 200000, 2000000, 20000000]);
    }  else {
        y = yLinear;
        yAxis.scale(y).tickValues(null);
    }

    // Set all existing dots to prev class
    svg.selectAll( "circle.curr.dot" )
        .attr("class", "prev dot");

    // Initialize new dots according to old axes
    if ((iteration < 5) && (largestIteration[iteration-1])) {
        largestIteration[iteration-1] = false;
        var curr_dots = svg.selectAll( "curr dot" )
            .data(csv[iteration].values)
            .enter().append("circle")
            .attr("class", "curr dot" )
            .attr("r", function(d) { return r(d.Prize); })
            .attr("cy", function(d) { return y(d.Prize); })
            .attr("fill", "url(#gradient)")
            .attr("cx", width + margin.right * 2)
            .on("mouseover", function(d) { updateTooltip(d); } )
            .on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
            .on("mouseout", function(){return tooltip.style("visibility", "hidden");});
    }

    // Update axes with new data
    x.domain([d3.time.format("%m/%d/%y").parse("01/01/11"), d3.max(currData, function(d) { return d.Date; })]).nice();
    yLinear.domain([0, d3.max(currData, function(d) { return d.Prize; })]).nice();
    r.domain([0, d3.max(currData, function(d) { return d.Prize; })]);
    yLog.domain([d3.min(currData, function(d) { return d.Prize; }), d3.max(currData, function(d) { return d.Prize; })]).nice();

    // Move ALL nodes into place in accordance to updated axes
    svg.transition()
        .select(".x.axis")
        .duration(750)
        .call(xAxis);
    svg.transition()
        .select(".y.axis")
        .duration(750)
        .call(yAxis)
    svg.selectAll( "circle.prev.dot" )
        .transition()
        .duration(750)
        .style("fill-opacity", 1)
        .each( function()  {
            if (caller == 0 && iteration == 5) {
                return svg.selectAll ( "circle.prev.dot" ).transition().duration(750).delay(750);
            }
        })
        .each( function(d)  {

            var start = parseDate(d.Start);
            if (iteration == 0 && start > parseDate("01/01/12")) {
                d3.select(this).transition().duration(750).style("fill-opacity", 0);
            } else if (iteration == 1 && start > parseDate("01/01/13")) {
                d3.select(this).transition().duration(750).style("fill-opacity", 0);
            } else if (iteration == 2 && start > parseDate("01/01/14")) {
                d3.select(this).transition().duration(750).style("fill-opacity", 0);
            } else if (iteration == 3 && start > parseDate("01/01/15")) {
                d3.select(this).transition().duration(750).style("fill-opacity", 0);
            }

        })
        .attr("r", function(d) { return r(d.Prize); })
        .attr("cx", function(d) { return x(d.Date); })
        .attr("cy", function(d) { return y(d.Prize); })

    if ((iteration < 5) && (caller == 1)) {
        curr_dots
            .transition()
            .duration(750)
            .attr("cx", function(d) { return x(d.Date); })
            .attr("r", function(d) { return r(d.Prize); })
            .attr("cy", function(d) { return y(d.Prize); });
    }
}

function updateBars() {
    // Get rid of dots
    svg.selectAll("circle.prev.dot")
            .transition()
            .duration(750)
            .attr("cy", height)
            .attr("r", 0);

    x.domain([ parseDate("01/01/10") , parseDate("01/01/16") ])
        .range([0, width]);
    xAxis.scale(x).tickFormat(d3.time.format("%Y"));

    svg.transition()
        .select(".x.axis")
        .duration(750)
        .style("stroke", 0)
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)

    d3.select(svg.selectAll(".tick")[0][0]).attr("visibility","hidden");
    d3.select(svg.selectAll(".tick")[0][6]).attr("visibility","hidden");

    y = yLinear;
    y.domain([0, d3.max(sums, function(d) { return d.sum; })]).nice()
    yAxis.scale(y).tickValues(null);
    svg.transition()
        .select(".y.axis")
        .duration(750)
        .call(yAxis)

    if (largestIteration[iteration-1]) {
        largestIteration[iteration-1] = false;
        svg.selectAll(".bar")
            .data(sums)
            .enter().append("rect")
            .attr("class", "bar")
            .on("mouseover", function(d) {
                    tooltip
                        .html( "<b>Total Prize: $" + d.sum  +"</b>")
                        .style("visibility", "visible") })
            .on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
            .on("mouseout", function(){return tooltip.style("visibility", "hidden");})
            .attr("x", function(d) {return x(d.year) - (width / 5 - margin.right) / 2; } )
            .attr("width", (width / 5 - margin.right))
            .attr("y", height)
            .attr("height", 0)
            .transition()
            .duration(750)
            .delay(750)
            .attr("y", function(d) { return y(d.sum); } )
            .attr("height", function(d) { return height - y(d.sum); });
    } else {
        svg.selectAll(".bar")
            .data(sums)
            .transition()
            .duration(750)
            .delay(750)
            .attr("y", function(d) { return y(d.sum); } )
            .attr("height", function(d) { return height - y(d.sum); } );
    }
}

function concatData(iter) {
    var container = [];
    for (var i = 0; i <= iter; i++) {
        container = container.concat(csv[i].values);
    }
    return container;
}

function processData(caller) {
    if (iteration >= 6) {
        iteration = 6;
    } else if (iteration <= 0) {
        iteration = 0;
    }

    if (iteration >= 5) {
        currData = concatData(4);
    } else {
        currData = concatData(iteration);
    }
}

function updateTracker() {
    tracker.select("rect")
        .transition()
        .duration(750)
        .attr("width", trackScale(iteration+1));
}


function controller() {
    updateTracker();
    updateDesc();
    if (iteration <= 5) {
        updateDots();
    }
    if (iteration > 5) { // Sums
        updateBars();
    }
}

// ** Update data section (Called from the onclick)
function increment() {
    caller = 1;
    iteration++;
    if (iteration == largestIteration) {
        largestIteration++;
    }
    processData(caller);
    controller();
}
function decrement () {
    caller = 0;
    iteration--;
    processData(caller);
    controller();
}
