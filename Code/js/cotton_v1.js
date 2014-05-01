var margin = {top: 50, right: 50, bottom: 50, left: 50},
    width = 960 - margin.left - margin.right,
    height = 580 - margin.bottom - margin.top,
    active = d3.select(null);

var commasFormatter = d3.format(",.0f")
var commasFormatter = d3.format(",")
var parseDate = d3.time.format("%Y").parse;
var projection = d3.geo.mercator()
    .scale(150)
    .translate([width / 2, height / 2])
    .precision(.1);

var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

var path = d3.geo.path()
    .projection(projection);

var x = d3.time.scale().range([0, width]),
    y = d3.scale.linear().range([50, 0]),
    yAxis = d3.svg.axis().scale(y).orient("left");

        var area = d3.svg.area()
          .interpolate("monotone")
          .x(function(d) { return x(d.date); })
          .y0(50)
          .y1(function(d) { return y(d.total); });

var ussr = {
  "860": 1, "804": 1, "795": 1, "762": 1, "643": 1, "498": 1, "51": 1, "31": 1,
  "112": 1, "233": 1, "268": 1, "398": 1, "417": 1, "428": 1, "440": 1
};

var yug = {
  "705": 1, "191": 1, "807": 1, "499": 1, "688": 1, "70": 1, "-999":1
};

var eth= {
  "232": 1, "231": 1
};


var svg = d3.select("#vis").append("svg")
    .attr("width", width)
    .attr("height", height)
    .on("click", stopped, true);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", reset);

var g = svg.append("g");

var tooltip = d3.select("body").append("div")
                    .attr("class", "tooltip");

var legend =  svg.append("g").attr("id", "legend");
var circles =  svg.append("g").attr("id", "circles");
var pies =  svg.append("g").attr("id", "pies");
var arc = d3.svg.arc()
svg
    .call(zoom) // delete this line to disable free zooming
    .call(zoom.event);

queue()
    .defer(d3.json, "data/world-50m.json")
    .defer(d3.csv, "data/water_pc.csv", type)
    .defer(d3.csv, "data/cotton_pc.csv", type)
    .defer(d3.csv, "data/water_total.csv", type)
    .defer(d3.csv, "data/cotton_total.csv", type)
    .defer(d3.csv, "data/sp500.csv", type2)
    .await(ready);

function ready(error, world, water_pc,cotton_pc,water_total,cotton_total,sp500) {
      var nameById = {};
      var cotton_pcById = d3.nest()
        .key(function(d) { return d.id; })
        .map(cotton_pc, d3.map);

      cotton_pc.forEach(function(d) {
        nameById[d.id] = d.name;
      });
      
      x.domain(d3.extent(sp500.map(function(d) { return d.date; })));
      y.domain([0, d3.max(sp500.map(function(d) { return d.total; }))]);

      // Extract years and compute min/max years
      var years    = d3.keys(cotton_pc[0])
                   .filter(function(d) { return d.match(/^\d/); })
                   .map(   function(d) { return parseInt(d); }),
          min_year = d3.min(years),
          max_year = d3.max(years),

      // Starting year
          year     = top.location.search.replace(/\?/, "") || max_year;
      // Extract min/max values from the whole dataset
      var cotton_pc_values   = d3.merge(
                   cotton_pc
                     .map(function(d) { return d3.entries(d).filter(function(d) { return d.key.match(/^\d/); }); })
                     .map(function(d) { return d.map(function(d) { 
                      return d.value; }); })
                     .map(function(d) { return d.map(function(d) { 
                      return parseFloat(d); }) })
                     .map(function(d) { return d.filter(function(d) { return !isNaN(d); }) })
                 );
      var cotton_total_values   = d3.merge(
                   cotton_total
                     .map(function(d) { return d3.entries(d).filter(function(d) { return d.key.match(/^\d/); }); })
                     .map(function(d) { return d.map(function(d) { 
                      return d.value; }); })
                     .map(function(d) { return d.map(function(d) { 
                      return parseFloat(d); }) })
                     .map(function(d) { return d.filter(function(d) { return !isNaN(d); }) })
                 );

      var blue_water_pc_values = d3.merge(
                   water_pc
                     .map(function(d) { return d3.entries(d).filter(function(d) { 
                      return d.key.match(/blue/); }); })
                     .map(function(d) { return d.map(function(d) {
                      return d.value; }); })
                     .map(function(d) { return d.map(function(d) { 
                      return parseFloat(d || 0.00001); }) })       
                 );
      var green_water_pc_values = d3.merge(
                   water_pc
                     .map(function(d) { return d3.entries(d).filter(function(d) { 
                      return d.key.match(/green/); }); })
                     .map(function(d) { return d.map(function(d) {
                      return d.value; }); })
                     .map(function(d) { return d.map(function(d) { 
                      return parseFloat(d || 0.00001); }) })
                 );
      var blue_water_total_values = d3.merge(
                   water_total
                     .map(function(d) { return d3.entries(d).filter(function(d) { 
                      return d.key.match(/blue/); }); })
                     .map(function(d) { return d.map(function(d) {
                      return d.value; }); })
                     .map(function(d) { return d.map(function(d) { 
                      return parseFloat(d || 0.00001); }) })       
                 );
      var green_water_total_values = d3.merge(
                   water_total
                     .map(function(d) { return d3.entries(d).filter(function(d) { 
                      return d.key.match(/green/); }); })
                     .map(function(d) { return d.map(function(d) {
                      return d.value; }); })
                     .map(function(d) { return d.map(function(d) { 
                      return parseFloat(d || 0.00001); }) })
                 );
      
      

      var water_pc_sum = [];
      for(var i=0; i< blue_water_pc_values.length; i++) {
          water_pc_sum.push(blue_water_pc_values[i]+green_water_pc_values[i]);
      }
      var max_water_pc = d3.max(water_pc_sum)
      var min_water_pc = d3.min(water_pc_sum)

      var water_total_sum = [];
      for(var i=0; i< blue_water_total_values.length; i++) {
          water_total_sum.push(blue_water_total_values[i]+green_water_total_values[i]);
      }
      var max_water_total = d3.max(water_total_sum)
      var min_water_total = d3.min(water_total_sum)
      console.log(d3.max(cotton_pc_values))
      // Extract data for selected year
      // (Returns a hash in the form of { <COUNTRY ID> : <VALUE> } for selected year)
      var data_cotton_pc = function() {
                   return cotton_pc
                     .reduce( function(previous, current, index) {
                       previous[ current["id"] ] = parseFloat(current[year]);
                       return previous;
                     }, {})
                  };
      var data_water_pc = function(d) {
                     return water_pc
                     .reduce( function(previous, current, index) {
                       previous[ current["id"] ] = [parseFloat(current[year + " blue"]  || 0.00001),parseFloat(current[year + " green"]  || 0.00001)];
                       return previous;
                     }, {})
                  };

      var data_cotton_total = function() {
                   return cotton_total
                     .reduce( function(previous, current, index) {
                       previous[ current["id"] ] = parseFloat(current[year]);
                       return previous;
                     }, {})
                  };
      var data_water_total = function(d) {
                     return water_total
                     .reduce( function(previous, current, index) {
                       previous[ current["id"] ] = [parseFloat(current[year + " blue"]  || 0.00001),parseFloat(current[year + " green"]  || 0.00001)];
                       return previous;
                     }, {})
                  };

        //Legends

        //scales
        var scale = colorbrewer.Oranges[9];
        var scaleExport = colorbrewer.Oranges[9];

        //domain for total production
        var color_domain = [2500000,5000000,7500000,10000000,12500000,15000000,17500000,20000000]
        var ext_color_domain = [0, 2500000,5000000,7500000,10000000,12500000,15000000,17500000,20000000]
        var legend_labels_total = ["< 2,500,000","2,500,000+" ,"5,000,000+", "7,500,000+", "10,000,000+", "12,500,000+","15,000,000+", "17,500,000+","> 20,000,000"]

        var outColor = d3.scale.threshold()
        .domain(color_domain)
        .range(["#F3D9DE","#E7AEBD","#D8859B","#C95979","#B8365A","#9A2148","#79173A","#59102D","#41021F"]);


        //domain for production per capita
        var color_domain_pc = [10, 20, 30, 40, 50,60,70,80]
        var ext_color_domain_pc = [0, 10, 20, 30, 40, 50,60,70,80]
        var legend_labels_total_pc = ["0-10", "10-20", "20-30", "30-40", "40-50","50-60","60-70","70-80", "> 80"]

        var outColor_pc = d3.scale.threshold()
        .domain(color_domain_pc)
        .range(["#F3D9DE","#E7AEBD","#D8859B","#C95979","#B8365A","#9A2148","#79173A","#59102D","#41021F"]);

        //display all countries
        var countries = topojson.feature(world, world.objects.countries),
            countries_ussr = {type: "FeatureCollection", features: countries.features.filter(function(d) { return d.id in ussr; })}
            countries_yug = {type: "FeatureCollection", features: countries.features.filter(function(d) { return d.id in yug; })};
            countries_eth = {type: "FeatureCollection", features: countries.features.filter(function(d) { return d.id in eth; })};

        var country = g.selectAll("path")
            .data(topojson.feature(world, world.objects.countries).features)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "country")
            .attr("id",function(d) { return d.id; })
            .attr("title", function(d,i) { return d.properties.name; })
            .on("click", clicked);

        g.append("path")
            .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
            .attr("class", "country-boundary")
            .attr("d", path);

        // display USSR
        var countryUssrB = g.append("path")
            .datum(countries_ussr)
            .attr("class", "country selected-boundary")
            .attr("d", path);

        var countryUssr = g.append("path")
            .datum(countries_ussr)
            .attr("class", "country selected")
            .attr("d", path)
            .on("click", clicked);

        // display Yugoslavia
        var countryYuB =  g.append("path")
            .datum(countries_yug)
            .attr("class", "country selected-boundary")
            .attr("d", path);

        var countryYu = g.append("path")
            .datum(countries_yug)
            .attr("class", "country selected")
            .attr("d", path)
            .on("click", clicked);

        // display Ethiopia PDR
        var countryEthB =  g.append("path")
            .datum(countries_eth)
            .attr("class", "country selected-boundary")
            .attr("d", path);

        var countryEth = g.append("path")
            .datum(countries_eth)
            .attr("class", "country selected")
            .attr("d", path)
            .on("click", clicked);


        // pies

        //radius for symbol map
        var radius = d3.scale.sqrt()
          .domain([min_water_pc ,max_water_pc])
          .range([0, 30]);

        var radius_total = d3.scale.sqrt()
          .domain([min_water_total ,max_water_total])
          .range([0, 30]);

        var colorWater = d3.scale.ordinal().range(["#337DBA","#49B044"]);
        var pie = d3.layout.pie();

        var piegroup = g.selectAll(".pie")
              .data(water_pc) 
              .enter().append("g")
              .attr("class","pie")
              .attr("transform", function (d) {
                  return ("translate(" + projection([d.lon,d.lat])[0] + "," +
                      projection([d.lon,d.lat])[1] + ")");
              });

        arc
          .outerRadius(function (d,i) {
              return radius(data_water_pc()[this.parentNode.__data__.id][0]+data_water_pc()[this.parentNode.__data__.id][1]);
          })
          .innerRadius(0);

         var arcs = piegroup.selectAll("path")
              .data(function(d) {return pie(data_water_pc()[d.id]); })
              .enter().append("svg:path")
               .attr("d", arc)
               .each(function(d) { 
               this._current = d;}) // store the initial angles
               .attr("class","slice")
              .style("fill", function(d, i) { return colorWater(i); });

          // legend
          var legendGroup = legend.selectAll(".lentry")
            .data(ext_color_domain_pc)
            .enter()
            .append("g")
            .attr("class","leg")
            //.attr("transform", "translate(0," + (height-150) + ")");
          
              legendGroup.append("rect")
                .attr("y", function(d,i) { return((height-20)-i*20)})
                .attr("width","20px")
                .attr("height","20px")
                .style("fill", function(d, i) { return outColor_pc(d); })
                .attr("stroke","#7f7f7f")
                .attr("stroke-width","0.5");

              var legendLabels = legendGroup.append("text")
                .attr("class", "legText")
                .attr("x", 25)
                .attr("y", function(d, i) { return ((height-20)-20 * i) + 14; })
                .text(function(d, i){ return legend_labels_total_pc[i] + " tons"; })



  var update_total = function() {
    // Continue cycle when hitting dataset boundaries
    if ( year < min_year ) year = max_year;
    if ( year > max_year ) year = min_year;

    //USSR & Yugoslavia display based on year
    if(year >= "1992"){
      countryYu.style("display","none");
      countryYuB.style("display","none");
      countryUssrB.style("display","none");
      countryUssr.style("display","none");
    }else{
      countryYu.style("display","block");
      countryYuB.style("display","block");
      countryUssrB.style("display","block");
      countryUssr.style("display","block");
    }

    if(year >= "1993"){
      countryEthB.style("display","none");
      countryEth.style("display","none");
    }else{
      countryEthB.style("display","block");
      countryEth.style("display","block");
    }

    
    // ** update_capita the year in the header
    d3.select("h1 .year").text(year);
    d3.select("h1 .unit").text("total");
    d3.select(".waterswitch").text("total");
  
    
      legendLabels
      .transition().duration(250)
        .text(function(d, i){ 
          return legend_labels_total[i] + " (1000 tons)"; })

    // * Countries
    // ** Add colorization based on the color scale (animated)
    country
      .transition().duration(250)
      .style("fill",  function(d) { return data_cotton_total()[d.id] ? outColor(data_cotton_total()[d.id]) : null; });
    
    countryUssr
      .transition().duration(250)
      .style("fill",  function(d) { return data_cotton_total()[810] ? outColor(data_cotton_total()[810]) : null; });

    countryYu
      .transition().duration(250)
      .style("fill",  function(d) { return data_cotton_total()[891] ? outColor(data_cotton_total()[891]) : null; });

    countryEth
      .transition().duration(250)
      .style("fill",  function(d) { return data_cotton_total()[230] ? outColor(data_cotton_total()[230]) : null; });



    var piegroup = g.selectAll(".pie")
      .transition()

    arc
      .outerRadius(function (d,i) {
          return radius_total(data_water_total()[this.parentNode.__data__.id][0]+data_water_total()[this.parentNode.__data__.id][1]);
     })

    var arcs = piegroup.selectAll("path")
    .data(function(d) {return pie(data_water_pc()[d.id]); })
      .transition().duration(150)
      .attr("d", arc)
      //.attrTween("d", arcTween);


    // ** Show/hide tooltip
    country
      .on("mousemove", function(d,i) {
        if(!(isNaN(d3.round(data_cotton_total()[d.id], 1)))){
        var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
            tooltip
            .classed("hidden", false)
            .attr("style", "left:"+(mouse[0]+25)+"px;top:"+(mouse[1]+85)+"px")

            .html(nameById[d.id]+' <span class="sep">|</span> '+commasFormatter(data_cotton_total()[d.id], 1) + " tons")
          }
      })

      .on("mouseout",  function(d,i) {
          tooltip.classed("hidden", true)
      });

      countryYu
      .on("mousemove", function(d,i) {
        if(!(isNaN(d3.round(data_cotton_total()[891], 1)))){
        var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
            tooltip
            .classed("hidden", false)
            .attr("style", "left:"+(mouse[0]+25)+"px;top:"+(mouse[1]+85)+"px")

            .html(nameById[891]+' <span class="sep">|</span> '+commasFormatter(data_cotton_total()[891], 1) + " tons")
          }
      })

      .on("mouseout",  function(d,i) {
          tooltip.classed("hidden", true)
      });

      countryUssr
      .on("mousemove", function(d,i) {
        if(!(isNaN(d3.round(data_cotton_total()[810], 1)))){
        var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
            tooltip
            .classed("hidden", false)
            .attr("style", "left:"+(mouse[0]+25)+"px;top:"+(mouse[1]+85)+"px")

            .html(nameById[810]+' <span class="sep">|</span> '+commasFormatter(data_cotton_total()[810], 1) + " tons")
          }
      })

      .on("mouseout",  function(d,i) {
          tooltip.classed("hidden", true)
      });

      countryEth
      .on("mousemove", function(d,i) {
        if(!(isNaN(d3.round(data_cotton_total()[230], 1)))){
        var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
            tooltip
            .classed("hidden", false)
            .attr("style", "left:"+(mouse[0]+25)+"px;top:"+(mouse[1]+85)+"px")

            .html(nameById[230]+' <span class="sep">|</span> '+commasFormatter(data_cotton_total()[230], 1) + " tons")
          }
      })

      .on("mouseout",  function(d,i) {
          tooltip.classed("hidden", true)
      });

    return svg;

  };
  // update_capita the chart graphics based on new data for selected year
  var update_capita = function() {

    // Continue cycle when hitting dataset boundaries
    if ( year < min_year ) year = max_year;
    if ( year > max_year ) year = min_year;

    //USSR & Yugoslavia display based on year
    if(year >= "1992"){
      countryYu.style("display","none");
      countryYuB.style("display","none");
      countryUssrB.style("display","none");
      countryUssr.style("display","none");
    }else{
      countryYu.style("display","block");
      countryYuB.style("display","block");
      countryUssrB.style("display","block");
      countryUssr.style("display","block");
    }

    if(year >= "1993"){
      countryEthB.style("display","none");
      countryEth.style("display","none");
    }else{
      countryEthB.style("display","block");
      countryEth.style("display","block");
    }

    
    // ** update_capita the year in the header
    d3.select("h1 .year").text(year);
    d3.select("h1 .unit").text("per capita");

    legendLabels
      .transition().duration(250)
        .text(function(d, i){ 
          return legend_labels_total_pc[i] + " tons"; })

    // * Countries
    // ** Add colorization based on the color scale (animated)
    country
      .transition().duration(250)
      .style("fill",  function(d) { return data_cotton_pc()[d.id] ? outColor_pc(data_cotton_pc()[d.id]) : null; });
    
    countryUssr
      .transition().duration(250)
      .style("fill",  function(d) { return data_cotton_pc()[810] ? outColor_pc(data_cotton_pc()[810]) : null; });

    countryYu
      .transition().duration(250)
      .style("fill",  function(d) { return data_cotton_pc()[891] ? outColor_pc(data_cotton_pc()[891]) : null; });

    countryEth
      .transition().duration(250)
      .style("fill",  function(d) { return data_cotton_pc()[230] ? outColor_pc(data_cotton_pc()[230]) : null; });

//pies

    var piegroup = g.selectAll(".pie")
      .transition()

    arc
      .outerRadius(function (d,i) {
          return radius(data_water_pc()[this.parentNode.__data__.id][0]+data_water_pc()[this.parentNode.__data__.id][1]);
     })

    var arcs = piegroup.selectAll("path")
      .transition().duration(150)
      .attr("d", arc)
      //.transition().duration(750).attrTween("d", arcTween);


    // ** Show/hide tooltip
    country
      .on("mousemove", function(d,i) {
        if(!(isNaN(d3.round(data_cotton_pc()[d.id], 1)))){
        var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
            tooltip
            .classed("hidden", false)
            .attr("style", "left:"+(mouse[0]+25)+"px;top:"+(mouse[1]+85)+"px")

            .html(nameById[d.id]+' <span class="sep">|</span> '+commasFormatter(data_cotton_pc()[d.id], 1) + " tons")
          }
      })

      .on("mouseout",  function(d,i) {
          tooltip.classed("hidden", true)
      });

      countryYu
      .on("mousemove", function(d,i) {
        if(!(isNaN(d3.round(data_cotton_pc()[891], 1)))){
        var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
            tooltip
            .classed("hidden", false)
            .attr("style", "left:"+(mouse[0]+25)+"px;top:"+(mouse[1]+85)+"px")

            .html(nameById[891]+' <span class="sep">|</span> '+commasFormatter(data_cotton_pc()[891], 1) + " tons")
          }
      })

      .on("mouseout",  function(d,i) {
          tooltip.classed("hidden", true)
      });

      countryUssr
      .on("mousemove", function(d,i) {
        if(!(isNaN(d3.round(data_cotton_pc()[810], 1)))){
        var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
            tooltip
            .classed("hidden", false)
            .attr("style", "left:"+(mouse[0]+25)+"px;top:"+(mouse[1]+85)+"px")

            .html(nameById[810]+' <span class="sep">|</span> '+commasFormatter(data_cotton_pc()[810], 1) + " tons")
          }
      })

      .on("mouseout",  function(d,i) {
          tooltip.classed("hidden", true)
      });

      countryEth
      .on("mousemove", function(d,i) {
        if(!(isNaN(d3.round(data_cotton_pc()[230], 1)))){
        var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
            tooltip
            .classed("hidden", false)
            .attr("style", "left:"+(mouse[0]+25)+"px;top:"+(mouse[1]+85)+"px")

            .html(nameById[230]+' <span class="sep">|</span> '+commasFormatter(data_cotton_pc()[230], 1) + " tons")
          }
      })

      .on("mouseout",  function(d,i) {
          tooltip.classed("hidden", true)
      });

    return svg;

  };

  // update_capita the chart on first load
  update_capita();


d3.selectAll(".unitswitch").on("change", change);
d3.selectAll(".waterswitch").on("change", switchwater);

var timeout = setTimeout(function() {
  d3.select(".unitswitch").property("checked", true).each(change);
  d3.select(".waterswitch").property("checked", true).each(switchwater);
}, 1000);


function change() {
      clearTimeout(timeout);
      if (this.value === "percapita") {
          update_capita()
          d3.select(window).on("keydown", function() {
            switch (d3.event.keyCode) {
              case 37: year = parseInt(year)-1; update_capita(); break;
              case 39: year = parseInt(year)+1; update_capita(); break;
            }
          });

          // Hook up autoplay
          var playing = false,
              loop    = null;
          d3.select("#autoplay").on("click", function() {
            d3.event.preventDefault();
            if (playing) {
              playing = false;
              clearInterval(loop);
              return d3.select(d3.event.target).text("autoplay");
            } else {
              playing = true;
              loop    = setInterval( function() { year += 1; update_capita(); }, 750 );
              return d3.select(d3.event.target).text("stop autoplay");
            }
          });
      }else if(this.value === "total")
      {   update_total();
          d3.select(window).on("keydown", function() {
            switch (d3.event.keyCode) {
              case 37: year = parseInt(year)-1; update_total(); break;
              case 39: year = parseInt(year)+1; update_total(); break;
            }
          });

          // Hook up autoplay
          var playing = false,
              loop    = null;
          d3.select("#autoplay").on("click", function() {
            d3.event.preventDefault();
            if (playing) {
              playing = false;
              clearInterval(loop);
              return d3.select(d3.event.target).text("autoplay");
            } else {
              playing = true;
              loop    = setInterval( function() { year += 1; update_total(); }, 750 );
              return d3.select(d3.event.target).text("stop autoplay");
            }
          });
      }
}

function switchwater() {
      clearTimeout(timeout);
      if (this.value === "on") {
          showpies()
          d3.select(".waterswitchlabel").text("hide");
      }else if(this.value === "off"){
          hidepies()
          d3.select(".waterswitchlabel").text("show");
      }
}

var slider = d3.select('#slider')
      .call(d3.slider()
        .axis(true)
        .min(min_year)
        .max(max_year)
        .step(1)
        .on("slide", function(evt, value) {
            year = value;
        })
      )
      .on("mouseup", function(evt, value) {
        setTimeout( function(){
          if(d3.select("#capita")[0][0].checked){
            update_capita();
          }else{
            update_total();
          }  
        }, 250);
      });

var context = d3.select('.d3-slider-axis').append("g")
                .attr("class", "context")
                .attr("transform", "translate(" + 50 + "," + 0 + ")");

              context.append("path")
                .datum(sp500)
                .attr("class", "area")
                .attr("d", area);

  return svg;
};

function clicked(d) {
  if (active.node() === this) return reset();
  active.classed("active", false);
  active = d3.select(this).classed("active", true);

  var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = .9 / Math.max(dx / width, dy / height),
      translate = [width / 2 - scale * x, height / 2 - scale * y];

  g.transition()
      .duration(750)
      .call(zoom.translate(translate).scale(scale).event);
}

function reset() {
  active.classed("active", false);
  active = d3.select(null);

  g.transition()
      .duration(750)
      .call(zoom.translate([0, 0]).scale(1).event);
}

function zoomed() {
  g.style("stroke-width", .5 / d3.event.scale + "px");
  g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  d3.selectAll(".slice").style("stroke-width", .5 / d3.event.scale + "px");
}

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
}

function type(d) {
  d.id = +d.id;
  return d;
}

function type2(d) {
  d.date = parseDate(d.date);
  d.total = +d.total;
  return d;
}

function arcTween(a) {
  var i = d3.interpolate(this._current, a);
  this._current = i(0);
  console.log( this._current)
  return function(t) {
    return arc(i(t));
  };
}

function showpies(){
      d3.selectAll(".pie").attr("visibility", "visible");
    }
function hidepies(){
      d3.selectAll(".pie").attr("visibility", "hidden");
    }



d3.select(self.frameElement).style("height", height + "px");