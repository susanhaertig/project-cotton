/*  
The basic code for the choropleth map that let's you cycle through the years
comes from Karel Minarik, 2013, Life Expectancy Choropleth Map, accessed on
[03/2014], https://gist.github.com/karmi/2366285

The zoom functionality comes from Mike Bostock, 2014, Zoom to Bounding Box II,
accessed on [04/2014], https://gist.github.com/mbostock/9656675.

The code for merging states with topojson comes from Mike Bostock, 2013, Merging
States II, accessed on [03/2014], https://gist.github.com/mbostock/5416440.

The code for the area chart comes from Mike Bostock, 2014, Focus+Context via
Brushing, accessed on [04/2014], https://gist.github.com/mbostock/1667367.

The basic code for the slider comes from Bjorn Sandvik, 2013, D3.js Slider,
accessed on [04/2014], https://github.com/turban/d3.slider and has been modified
to integrate an area chart.
*/

var margin = {top: 50, right: 0, bottom: 50, left: 0},
    width = 900 - margin.left - margin.right,
    height = 540 - margin.bottom - margin.top,
    heightChart = 50,
    active = d3.select(null),
    hover = d3.select(null),
    minRadius = 2,
    maxRadius = 30;

// number formatting
var commasFormatter = d3.format(",.0f"),
    tickformatValue = d3.format(".2s"),
    parseDate = d3.time.format("%Y").parse;
    si = d3.format('.2s'); siMod = function(val) { return si(val).replace(/G/, ' Billion').replace(/M/, ' Million').replace(/k/, ',000') };

// projection    
var projection = d3.geo.naturalEarth()
    .scale(190)
    .translate([width / 2, height / 2+20])
    .precision(.1);

var path = d3.geo.path()
    .projection(projection);

// zoom
var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

// scales for chart
var x = d3.time.scale().range([0, width-50]),
    y = d3.scale.linear().range([heightChart, 0]);

//scales for choropleth
var colorScale = ["#F3D9DE","#E7AEBD","#D8859B","#C95979","#B8365A","#9A2148","#79173A","#59102D","#41021F"]

//legend for total production
var color_domain = [2500000,5000000,7500000,10000000,12500000,15000000,17500000,20000000]
var ext_color_domain = [0, 2500000,5000000,7500000,10000000,12500000,15000000,17500000,20000000]
var legend_labels_total = ["< 2.5 billion","2.5 billion+" ,"5 billion+", "7.5 billion+", "10 billion+", "12.5 billion+","15 billion+", "17.5 billion+","> 20 billion"]

var outColor = d3.scale.threshold()
    .domain(color_domain)
    .range(colorScale);

//legend for production per capita
var color_domain_pc = [10, 20, 30, 40, 50,60,70,80]
var ext_color_domain_pc = [0, 10, 20, 30, 40, 50,60,70,80]
var legend_labels_total_pc = ["< 10", "10-20", "20-30", "30-40", "40-50","50-60","60-70","70-80", "> 80"]

var outColor_pc = d3.scale.threshold()
    .domain(color_domain_pc)
    .range(colorScale);

//Scale for pies
var colorWater = d3.scale.ordinal().range(["#337DBA","#49B044"]);

//radius for pies
var radius = d3.scale.sqrt()
    .clamp(true)
    .range([minRadius, maxRadius]);

var radius_total = d3.scale.sqrt()
    .clamp(true)
    .range([minRadius, maxRadius]);

// yAxis context chart
var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(5)
    .tickFormat(function(d) { return tickformatValue(d).replace('G', ' billion'); });

// context chart
var area = d3.svg.area()
    .interpolate("monotone")
    .x(function(d) { return x(d.date); })
    .y0(50)
    .y1(function(d) { return y(d.total); });

// define extra countries
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

var sudan= {
    "729": 1, "728": 1
};

var somalia= {
    "706": 1, "-99": 1
};

// define svg components
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
var tooltip = d3.select(".tooltip");
var legend =  svg.append("g").attr("id", "legend");
var pie = d3.layout.pie();

svg
    .call(zoom)
    .call(zoom.event);

queue()
    .defer(d3.json, "data/world-50m.json")
    .defer(d3.csv, "data/all.csv", type)
    .defer(d3.csv, "data/totalByYear.csv", type2)
    .await(ready);

function ready(error, world, all,totalByYear) {

      var nameById = {};
      all.forEach(function(d) {
        nameById[d.id] = d.name;
      });

      // domains for context chart
      x.domain(d3.extent(totalByYear.map(function(d) { return d.date; })));
      y.domain([0, d3.max(totalByYear.map(function(d) { return d.total; }))]);

      // Extract years and compute min/max years
      var years = d3.keys(all[0])
          .filter(function(d) { return d.match(/cotton_pc/); })
          .map(   function(d) { return parseInt(d); });
      var min_year = d3.min(years);
      var max_year = d3.max(years);

      // Starting year
      var year = top.location.search.replace(/\?/, "") || max_year;

      // Extract min/max values from the whole dataset
      var cotton_pc_values = d3.merge(
          all
            .map(function(d) { return d3.entries(d).filter(function(d) { return d.key.match(/cotton_pc/); }); })
            .map(function(d) { return d.map(function(d) { return d.value; }); })
            .map(function(d) { return d.map(function(d) { return parseFloat(d); }) })
            .map(function(d) { return d.filter(function(d) { return !isNaN(d); }) })
          );

      var cotton_total_values = d3.merge(
          all
             .map(function(d) { return d3.entries(d).filter(function(d) { return d.key.match(/cotton_total/); }); })
             .map(function(d) { return d.map(function(d) { return d.value; }); })
             .map(function(d) { return d.map(function(d) { return parseFloat(d); }) })
             .map(function(d) { return d.filter(function(d) { return !isNaN(d); }) })
         );

      var blue_water_pc_values = d3.merge(
          all
              .map(function(d) { return d3.entries(d).filter(function(d) {return d.key.match(/blue_pc/); }); })
              .map(function(d) { return d.map(function(d) {return d.value; }); })
              .map(function(d) { return d.map(function(d) { return parseFloat(d); }) })       
           );
      var green_water_pc_values = d3.merge(
          all
              .map(function(d) { return d3.entries(d).filter(function(d) { return d.key.match(/green_pc/); }); })
              .map(function(d) { return d.map(function(d) {return d.value; }); })
              .map(function(d) { return d.map(function(d) {return parseFloat(d); }) })
          );

      var blue_water_total_values = d3.merge(
          all
              .map(function(d) { return d3.entries(d).filter(function(d) {return d.key.match(/blue_total/); }); })
              .map(function(d) { return d.map(function(d) {return d.value; }); })
              .map(function(d) { return d.map(function(d) {return parseFloat(d); }) })       
          );

      var green_water_total_values = d3.merge(
          all
              .map(function(d) { return d3.entries(d).filter(function(d) {return d.key.match(/green_total/); }); })
              .map(function(d) { return d.map(function(d) {return d.value; }); })
              .map(function(d) { return d.map(function(d) {return parseFloat(d); }) })
          );

      // Calculate min/max values for water
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

      // Extract data for selected year
      // (Returns a hash in the form of { <COUNTRY ID> : <VALUE> } for selected year)
      var data_cotton_pc = function() {
          return all
            .reduce( function(previous, current, index) {
              previous[ current["id"] ] = parseFloat(current[year + " cotton_pc"]);
              return previous;
            }, {})
          };

      var data_water_pc = function(d) {
          return all
            .reduce( function(previous, current, index) {
              previous[ current["id"] ] = [parseFloat(current[year + " blue_pc"]  || 0.000000000001),
                                           parseFloat(current[year + " green_pc"]  || 0.000000000001)];
              return previous;
            }, {})
          };

      var data_cotton_total = function() {
          return all
            .reduce( function(previous, current, index) {
              previous[ current["id"] ] = parseFloat(current[year + " cotton_total"]);
              return previous;
            }, {})
          };

      var data_water_total = function(d) {
          return all
            .reduce( function(previous, current, index) {
              previous[ current["id"] ] = [parseFloat(current[year + " blue_total"]  || 0.000000000001),
                                           parseFloat(current[year + " green_total"]  || 0.000000000001)];
              return previous;
            }, {})
          };

      var data_water_resource_pc = function() {
          return all
            .reduce( function(previous, current, index) {
              previous[ current["id"] ] = parseFloat(current[year + " water_pc"]);
              return previous;
            }, {})
          };


      //display all countries
      var countries = topojson.feature(world, world.objects.countries),
          countries_ussr = {type: "FeatureCollection", features: countries.features.filter(function(d) { return d.id in ussr; })}
          countries_yug = {type: "FeatureCollection", features: countries.features.filter(function(d) { return d.id in yug; })};
          countries_eth = {type: "FeatureCollection", features: countries.features.filter(function(d) { return d.id in eth; })};
          countries_sudan = {type: "FeatureCollection", features: countries.features.filter(function(d) { return d.id in sudan; })};
          countries_somalia = {type: "FeatureCollection", features: countries.features.filter(function(d) { return d.id in somalia; })};

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

          // display Sudan
      var countrySudanB =  g.append("path")
          .datum(countries_sudan)
          .attr("class", "country selected-boundary")
          .attr("d", path);

      var countrySudan = g.append("path")
          .datum(countries_sudan)
          .attr("class", "country selected")
          .attr("d", path)
          .on("click", clicked);

          // display Somalia
      var countrySomaliaB =  g.append("path")
          .datum(countries_somalia)
          .attr("class", "country selected-boundary")
          .attr("d", path);

      var countrySomalia = g.append("path")
          .datum(countries_somalia)
          .attr("class", "country selected")
          .attr("d", path)
          .on("click", clicked);


      // display pie charts

      //radius domain for pies
      radius.domain([min_water_pc ,max_water_pc]);
      radius_total.domain([min_water_total ,max_water_total]);

      var piegroup = g.selectAll(".pie")
          .data(all) 
          .enter().append("g")
          .attr("class","pie")
          .attr("transform", function (d) {
              return ("translate(" + projection([d.lon,d.lat])[0] + "," + projection([d.lon,d.lat])[1] + ")");
          });

      var arcs = piegroup.selectAll("path")
          .data(function(d) {return pie(data_water_pc()[d.id]); })
          .enter()
          .append("svg:path")
          .attr("d", d3.svg.arc()
              .outerRadius(function (d,i) {
                  return radius(data_water_pc()[this.parentNode.__data__.id][0]+data_water_pc()[this.parentNode.__data__.id][1]);
                })
              .innerRadius(0)
          )
          .each(function(d) {this._current = d;}) // store the initial angles
          .attr("class","slice")
          .style("visibility", function (d,i) {
              if(radius(data_water_pc()[this.parentNode.__data__.id][0]+data_water_pc()[this.parentNode.__data__.id][1])!=2){
                  return "visible";
              }else{
                  return "hidden"
              }
          })
          .style("fill", function(d, i) { return colorWater(i); });
      
      //Show slider on bottom
      var slider = d3.select('#slider')
          .call(d3.slider()
          .axis(true)
          .value(max_year)
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
                update();
                update_capita();
              }else{
                update();
                update_total();
              }  
            }, 250);
          });

      //append chart to slider
      var context = d3.select('.d3-slider-axis').append("g")
          .attr("class", "context")
          .attr("transform", "translate(" + 70 + "," + 0 + ")");

        context.append("g")
          .attr("class", "y axis")
          .call(yAxis)
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 5)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("tons");

        context.append("path")
            .datum(totalByYear)
            .attr("class", "area")
            .attr("d", area);

      // display legend
      var legendGroup = legend.selectAll(".lentry")
          .data(ext_color_domain_pc)
          .enter()
          .append("g")
          .attr("class","leg");
        
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

      //general update function
      var update = function() {

          // Continue cycle when hitting dataset boundaries
          if ( year < min_year ) year = max_year;
          if ( year > max_year ) year = min_year;

          //USSR & Yugoslavia & Ethiopia display based on year
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

          // ** Show/hide tooltip

          country
            .on("mouseover", function(d,i) {
                if(!(isNaN(data_cotton_total()[d.id]))){
                  country
                    hover.classed("hover", false)
                    hover = d3.select(this).classed("hover", true)
                    .style("cursor", "pointer")
                    tooltip
                          .classed("hidden", false)
                      d3.select("h2.country").html(function() {
                          return nameById[d.id];
                      });
                      d3.select(".red").html(function() {
                        if(!(isNaN(data_cotton_total()[d.id]))){
                          return "produced <span>"+d3.round(data_cotton_pc()[d.id], 3) + " tons</span> of cotton per <span class='capitaicon'>capita</span>"+
                                  "</br>and <span>"+siMod(data_cotton_total()[d.id]*1000) + " tons</span> of cotton total";
                        }
                      });
                      d3.select(".blue").html(function() {
                        if(data_water_total()[d.id][0] > 0.00001){
                          return "used <span>"+d3.round(data_water_pc()[d.id][0], 3) + " m&sup3;</span> blue water per <span class='capitaicon'>capita</span>"+
                                "</br>and <span>"+ siMod(data_water_total()[d.id][0]*1000) + " m&sup3</span> of blue water total";
                        }else{
                          return "<strong style='line-height:43px'>used <span>0</span> or no data</strong>";
                        }
                      });
                      d3.select(".green").html(function() {
                        if(data_water_total()[d.id][1] > 0.00001){
                          return "used <span>"+d3.round(data_water_pc()[d.id][1], 3) + " m&sup3;</span> green water per <span class='capitaicon'>capita</span>"+
                                "</br>and <span>"+siMod(data_water_total()[d.id][1]*1000) + " m&sup3</span> of green water total";
                        }
                      });
                      d3.select(".resources").html(function() {
                        if(data_water_resource_pc()[d.id]){
                          return "These are <span>"+d3.round(((data_water_pc()[d.id][1]+data_water_pc()[d.id][0])*100)/data_water_resource_pc()[d.id], 3) + "</span> % of total renewable water resources of one <span class='capitaicon'></span>";
                        }else{
                          return "<strong style='line-height:40px'>no data</strong>";
                        }
                      });
                }
            })
            .on("mouseout",  function(d,i) {
                country.style("cursor", "default")
                hover.classed("hover", false);
                hover = d3.select(null);
                tooltip.classed("hidden", true)
            });

          countryYu
            .on("mouseover", function(d,i) {
                if(!(isNaN(d3.round(data_cotton_pc()[891], 1)))){
                    countryYu
                        hover.classed("hover", false)
                        hover = d3.select(this).classed("hover", true)
                        .style("cursor", "pointer")
                        tooltip
                          .classed("hidden", false)
                          d3.select("h2.country").html(function() {
                            return nameById[891];
                          });
                          d3.select(".red").html(function() {
                            if(!(isNaN(data_cotton_total()[891]))){
                              return "produced <span>"+d3.round(data_cotton_pc()[891], 3) + " tons</span> of cotton per <span class='capitaicon'>capita</span>"+
                                      "</br>and <span>"+siMod(data_cotton_total()[891]*1000) + " tons</span> of cotton total";
                            }
                          });
                          d3.select(".blue").html(function() {
                            if(data_water_total()[891][0] > 0.00001){
                              return "used <span>"+d3.round(data_water_pc()[891][0], 3) + " m&sup3;</span> blue water per <span class='capitaicon'>capita</span>"+
                                    "</br>and <span>"+ siMod(data_water_total()[891][0]*1000) + " m&sup3</span> of blue water total";
                            }else{
                              return "<strong style='line-height:43px'>used <span>0</span> or no data</strong>";
                            }
                          });
                          d3.select(".green").html(function() {
                            if(data_water_total()[891][1] > 0.00001){
                              return "used <span>"+d3.round(data_water_pc()[891][1], 3) + " m&sup3;</span> green water per <span class='capitaicon'>capita</span>"+
                                    "</br>and <span>"+siMod(data_water_total()[891][1]*1000) + " m&sup3</span> of green water total";
                            }
                          });
                          d3.select(".resources").html(function() {
                            if(data_water_resource_pc()[891]){
                              return "These are <span>"+d3.round(((data_water_pc()[891][1]+data_water_pc()[891][0])*100)/data_water_resource_pc()[891], 3) + "</span> % of total renewable water resources of one <span class='capitaicon'></span>";
                            }else{
                              return "<strong style='line-height:40px'>no data</strong>";
                            }
                          });
                  
                }
            })

            .on("mouseout",  function(d,i) {
                countryYu.style("cursor", "default")
                hover.classed("hover", false);
                hover = d3.select(null);
                tooltip.classed("hidden", true)
            });

          countryUssr
            .on("mousemove", function(d,i) {
                if(!(isNaN(d3.round(data_cotton_pc()[810], 1)))){
                    countryUssr
                        hover.classed("hover", false)
                        hover = d3.select(this).classed("hover", true)
                        .style("cursor", "pointer")
                        tooltip
                          .classed("hidden", false)
                          d3.select("h2.country").html(function() {
                            return nameById[810];
                          });
                          d3.select(".red").html(function() {
                            if(!(isNaN(data_cotton_total()[810]))){
                              return "produced <span>"+d3.round(data_cotton_pc()[810], 3) + " tons</span> of cotton per <span class='capitaicon'>capita</span>"+
                                      "</br>and <span>"+siMod(data_cotton_total()[810]*1000) + " tons</span> of cotton total";
                            }
                          });
                          d3.select(".blue").html(function() {
                            if(data_water_total()[810][0] > 0.00001){
                              return "used <span>"+d3.round(data_water_pc()[810][0], 3) + " m&sup3;</span> blue water per <span class='capitaicon'>capita</span>"+
                                    "</br>and <span>"+ siMod(data_water_total()[810][0]*1000) + " m&sup3</span> of blue water total";
                            }else{
                              return "<strong style='line-height:43px'>used <span>0</span> or no data</strong>";
                            }
                          });
                          d3.select(".green").html(function() {
                            if(data_water_total()[810][1] > 0.00001){
                              return "used <span>"+d3.round(data_water_pc()[810][1], 3) + " m&sup3;</span> green water per <span class='capitaicon'>capita</span>"+
                                    "</br>and <span>"+siMod(data_water_total()[810][1]*1000) + " m&sup3</span> of green water total";
                            }
                          });
                          d3.select(".resources").html(function() {
                            if(data_water_resource_pc()[810]){
                              return "These are <span>"+d3.round(((data_water_pc()[810][1]+data_water_pc()[810][0])*100)/data_water_resource_pc()[810], 3) + "</span> % of total renewable water resources of one <span class='capitaicon'></span>";
                            }else{
                              return "<strong style='line-height:40px'>no data</strong>";
                            }
                          });
                }
            })

            .on("mouseout",  function(d,i) {
                countryUssr.style("cursor", "default")
                hover.classed("hover", false);
                hover = d3.select(null);
                tooltip.classed("hidden", true)
            });

          countryEth
            .on("mousemove", function(d,i) {
                if(!(isNaN(d3.round(data_cotton_pc()[230], 1)))){
                    countryEth
                      hover.classed("hover", false)
                      hover = d3.select(this).classed("hover", true)
                      .style("cursor", "pointer")
                      tooltip
                        .classed("hidden", false)
                        d3.select("h2.country").html(function() {
                            return nameById[230];
                          });
                          d3.select(".red").html(function() {
                            if(!(isNaN(data_cotton_total()[230]))){
                              return "produced <span>"+d3.round(data_cotton_pc()[230], 3) + " tons</span> of cotton per <span class='capitaicon'>capita</span>"+
                                      "</br>and <span>"+siMod(data_cotton_total()[230]*1000) + " tons</span> of cotton total";
                            }
                          });
                          d3.select(".blue").html(function() {
                            if(data_water_total()[230][0] > 0.00001){
                              return "used <span>"+d3.round(data_water_pc()[230][0], 3) + " m&sup3;</span> blue water per <span class='capitaicon'>capita</span>"+
                                    "</br>and <span>"+ siMod(data_water_total()[230][0]*1000) + " m&sup3</span> of blue water total";
                            }else{
                              return "<strong style='line-height:43px'>used <span>0</span> or no data</strong>";
                            }
                          });
                          d3.select(".green").html(function() {
                            if(data_water_total()[230][1] > 0.00001){
                              return "used <span>"+d3.round(data_water_pc()[230][1], 3) + " m&sup3;</span> green water per <span class='capitaicon'>capita</span>"+
                                    "</br>and <span>"+siMod(data_water_total()[230][1]*1000) + " m&sup3</span> of green water total";
                            }
                          });
                          d3.select(".resources").html(function() {
                            if(data_water_resource_pc()[230]){
                              return "These are <span>"+d3.round(((data_water_pc()[230][1]+data_water_pc()[230][0])*100)/data_water_resource_pc()[230], 3) + "</span> % of total renewable water resources of one <span class='capitaicon'></span>";
                            }else{
                              return "<strong style='line-height:40px'>no data</strong>";
                            }
                          });
                }
            })

            .on("mouseout",  function(d,i) {
                countryEth.style("cursor", "default")
                hover.classed("hover", false);
                hover = d3.select(null);
                tooltip.classed("hidden", true)
             });

            countrySudan
            .on("mousemove", function(d,i) {
                if(!(isNaN(d3.round(data_cotton_pc()[729], 1)))){
                    countrySudan
                      hover.classed("hover", false)
                      hover = d3.select(this).classed("hover", true)
                      .style("cursor", "pointer")
                      tooltip
                        .classed("hidden", false)
                        d3.select("h2.country").html(function() {
                            return nameById[729];
                          });
                          d3.select(".red").html(function() {
                            if(!(isNaN(data_cotton_total()[729]))){
                              return "produced <span>"+d3.round(data_cotton_pc()[729], 3) + " tons</span> of cotton per <span class='capitaicon'>capita</span>"+
                                      "</br>and <span>"+siMod(data_cotton_total()[729]*1000) + " tons</span> of cotton total";
                            }
                          });
                          d3.select(".blue").html(function() {
                            if(data_water_total()[729][0] > 0.00001){
                              return "used <span>"+d3.round(data_water_pc()[729][0], 3) + " m&sup3;</span> blue water per <span class='capitaicon'>capita</span>"+
                                    "</br>and <span>"+ siMod(data_water_total()[729][0]*1000) + " m&sup3</span> of blue water total";
                            }else{
                              return "<strong style='line-height:43px'>used <span>0</span> or no data</strong>";
                            }
                          });
                          d3.select(".green").html(function() {
                            if(data_water_total()[729][1] > 0.00001){
                              return "used <span>"+d3.round(data_water_pc()[729][1], 3) + " m&sup3;</span> green water per <span class='capitaicon'>capita</span>"+
                                    "</br>and <span>"+siMod(data_water_total()[729][1]*1000) + " m&sup3</span> of green water total";
                            }
                          });
                          d3.select(".resources").html(function() {
                            if(data_water_resource_pc()[729]){
                              return "These are <span>"+d3.round(((data_water_pc()[729][1]+data_water_pc()[729][0])*100)/data_water_resource_pc()[729], 3) + "</span> % of total renewable water resources of one <span class='capitaicon'></span>";
                            }else{
                              return "<strong style='line-height:40px'>no data</strong>";
                            }
                          });
                }
            })

            .on("mouseout",  function(d,i) {
                countrySudan.style("cursor", "default")
                hover.classed("hover", false);
                hover = d3.select(null);
                tooltip.classed("hidden", true)
             });

            countrySomalia
            .on("mousemove", function(d,i) {
                if(!(isNaN(d3.round(data_cotton_pc()[706], 1)))){
                    countrySomalia
                      hover.classed("hover", false)
                      hover = d3.select(this).classed("hover", true)
                      .style("cursor", "pointer")
                      tooltip
                        .classed("hidden", false)
                        d3.select("h2.country").html(function() {
                            return nameById[706];
                          });
                          d3.select(".red").html(function() {
                            if(!(isNaN(data_cotton_total()[706]))){
                              return "produced <span>"+d3.round(data_cotton_pc()[706], 3) + " tons</span> of cotton per <span class='capitaicon'>capita</span>"+
                                      "</br>and <span>"+siMod(data_cotton_total()[706]*1000) + " tons</span> of cotton total";
                            }
                          });
                          d3.select(".blue").html(function() {
                            if(data_water_total()[706][0] > 0.00001){
                              return "used <span>"+d3.round(data_water_pc()[706][0], 3) + " m&sup3;</span> blue water per <span class='capitaicon'>capita</span>"+
                                    "</br>and <span>"+ siMod(data_water_total()[706][0]*1000) + " m&sup3</span> of blue water total";
                            }else{
                              return "<strong style='line-height:43px'>used <span>0</span> or no data</strong>";
                            }
                          });
                          d3.select(".green").html(function() {
                            if(data_water_total()[706][1] > 0.00001){
                              return "used <span>"+d3.round(data_water_pc()[706][1], 3) + " m&sup3;</span> green water per <span class='capitaicon'>capita</span>"+
                                    "</br>and <span>"+siMod(data_water_total()[706][1]*1000) + " m&sup3</span> of green water total";
                            }
                          });
                          d3.select(".resources").html(function() {
                            if(data_water_resource_pc()[706]){
                              return "These are <span>"+d3.round(((data_water_pc()[706][1]+data_water_pc()[706][0])*100)/data_water_resource_pc()[706], 3) + "</span> % of total renewable water resources of one <span class='capitaicon'></span>";
                            }else{
                              return "<strong style='line-height:40px'>no data</strong>";
                            }
                          });
                }
            })

            .on("mouseout",  function(d,i) {
                countrySomalia.style("cursor", "default")
                hover.classed("hover", false);
                hover = d3.select(null);
                tooltip.classed("hidden", true)
             });

        return svg;
      }


      //Update for total production
      var update_total = function() {

          // ** update the year in the header
          d3.select("h1 .year").text(year);
          d3.select("h1 .unit").text("total");
          d3.select(".waterswitch").text("total");
  
          // ** update legend
          legendLabels
              .transition().delay(350).duration(500)
              .text(function(d, i){ return legend_labels_total[i] + " tons"; })

          // * update Countries
          // ** Add colorization based on the color scale (animated)
          country
            .transition().delay(350).duration(500)
            .style("fill",  function(d) { return data_cotton_total()[d.id] ? outColor(data_cotton_total()[d.id]) : null; });
          
          countryUssr
            .transition().delay(350).duration(500)
            .style("fill",  function(d) { return data_cotton_total()[810] ? outColor(data_cotton_total()[810]) : null; });

          countryYu
            .transition().delay(350).duration(500)
            .style("fill",  function(d) { return data_cotton_total()[891] ? outColor(data_cotton_total()[891]) : null; });

          countryEth
            .transition().delay(350).duration(500)
            .style("fill",  function(d) { return data_cotton_total()[230] ? outColor(data_cotton_total()[230]) : null; });

          countrySudan
            .transition().delay(350).duration(500)
            .style("fill",  function(d) { return data_cotton_total()[729] ? outColor(data_cotton_total()[729]) : null; });

          countrySomalia
            .transition().delay(350).duration(500)
            .style("fill",  function(d) { return data_cotton_total()[706] ? outColor(data_cotton_total()[706]) : null; });

          //Update pies
          arcs
              .data(function(d) {return pie(data_water_total()[d.id]);})
              .transition()
              .attr("d", d3.svg.arc()
                  .outerRadius(function (d,i) {
                    return radius_total(data_water_total()[this.parentNode.__data__.id][0]+data_water_total()[this.parentNode.__data__.id][1]);
                  })
                  .innerRadius(0)
              )
              .style("visibility", function (d,i) {
                  if(radius_total(data_water_total()[this.parentNode.__data__.id][0]+data_water_total()[this.parentNode.__data__.id][1])!=2){
                      return "visible";
                  }else{
                      return "hidden"
                  }
              });
                  
        return svg;
      };

      //Update for per capita production
      var update_capita = function() {

          // ** update the year in the header
          d3.select("h1 .year").text(year);
          d3.select("h1 .unit").text("per capita");

          // ** update legend
          legendLabels
              .transition().duration(250)
              .text(function(d, i){ return legend_labels_total_pc[i] + " tons"; })

          // * update Countries
          // ** Add colorization based on the color scale (animated)
          country
            .transition().delay(350).duration(500)
            .style("fill",  function(d) { return data_cotton_pc()[d.id] ? outColor_pc(data_cotton_pc()[d.id]) : null; });
          
          countryUssr
            .transition().delay(350).duration(500)
            .style("fill",  function(d) { return data_cotton_pc()[810] ? outColor_pc(data_cotton_pc()[810]) : null; });

          countryYu
            .transition().delay(350).duration(500)
            .style("fill",  function(d) { return data_cotton_pc()[891] ? outColor_pc(data_cotton_pc()[891]) : null; });

          countryEth
            .transition().delay(350).duration(500)
            .style("fill",  function(d) { return data_cotton_pc()[230] ? outColor_pc(data_cotton_pc()[230]) : null; });

          countrySudan
            .transition().delay(350).duration(500)
            .style("fill",  function(d) { return data_cotton_pc()[729] ? outColor(data_cotton_pc()[729]) : null; });

          countrySomalia
            .transition().delay(350).duration(500)
            .style("fill",  function(d) { return data_cotton_pc()[706] ? outColor(data_cotton_pc()[706]) : null; });

          //Update pies
          arcs
              .data(function(d) {return pie(data_water_pc()[d.id]);})
              .transition()
              .attr("d", d3.svg.arc()
                  .outerRadius(function (d,i) {
                    return radius(data_water_pc()[this.parentNode.__data__.id][0]+data_water_pc()[this.parentNode.__data__.id][1]);
                  })
                  .innerRadius(0)
              )
              .style("visibility", function (d,i) {
                  if(radius(data_water_pc()[this.parentNode.__data__.id][0]+data_water_pc()[this.parentNode.__data__.id][1])!=2){
                      return "visible";
                  }else{
                      return "hidden"
                    }
              });

        return svg;
      };

      // update and update_capita the chart on first load
      update();
      update_capita();

      //switches
      d3.selectAll(".unitswitch").on("change", change);
      d3.selectAll(".waterswitch").on("change", switchwater);

      var timeout = setTimeout(function() {
          d3.select(".unitswitch").property("checked", true).each(change);
          d3.select(".waterswitch").property("checked", true).each(switchwater);
      }, 1000);

      // switch for total/per capita
      function change() {
          clearTimeout(timeout);
          if (this.value === "percapita") {
              update()
              update_capita()
              d3.select(window).on("keydown", function() {
                  switch (d3.event.keyCode) {
                      case 37: year = parseInt(year)-1; update(); update_capita(); break;
                      case 39: year = parseInt(year)+1; update(); update_capita(); break;
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
                      loop    = setInterval( function() { year += 1; update(); update_capita(); }, 750 );
                      return d3.select(d3.event.target).text("stop autoplay");
                  }
              });
          }else if(this.value === "total"){ 
              update(); 
              update_total();
              d3.select(window).on("keydown", function() {
                  switch (d3.event.keyCode) {
                      case 37: year = parseInt(year)-1; update(); update_total(); break;
                      case 39: year = parseInt(year)+1; update(); update_total(); break;
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
                      loop    = setInterval( function() { year += 1; update(); update_total(); }, 750 );
                      return d3.select(d3.event.target).text("stop autoplay");
                  }
              });
          }
      }

      // switch for show/hide pies
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


  return svg;
};
//end of ready function

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
  d.total = +d.total*1000;
  return d;
}

function showpies(){d3.selectAll(".pie").attr("display", "block");}
function hidepies(){d3.selectAll(".pie").attr("display", "none");}

d3.select(self.frameElement).style("height", height + "px");