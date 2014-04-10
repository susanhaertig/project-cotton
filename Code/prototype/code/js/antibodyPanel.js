// SET UP SVG AREA
bbLaser = {
    x: 30,
    y: 0,
    w: 500,
    h: 200
};

spectra = {
    min: 350,
    max: 900,
}

d3.select("#spectralViewer")
  .append("svg")
  .attr("width", bbLaser.w * 3)
  .attr("height", bbLaser.h * 10)
  .append("g")
  .attr("id", "g_spectra");
  
d3.select("#spectralViewer")
  .select("svg")
  .append("g")
  .attr("id", "g_panel")
  .attr("transform", function(){
      var w = bbLaser.w + 30; 
      return "translate(" + w +", 0)";}
  );
                 
var svgSpectral = d3.select("#g_spectra"); 
var svgPanel = d3.select("#g_panel"); 




// SET UP COLOR GRADIENT
var colGradient = svgSpectral.append("defs")
                       .append("linearGradient")
                       .attr("id", "colorGradient")
                       .attr("x1", "0%")
                       .attr("x2", "100%")
                       .attr("y1", "0%")
                       .attr("y2", "0%");

function setGradient(gradient, color, stop, opacity){
    gradient.append("svg:stop")
        .attr("offset", stop+"%")
        .attr("stop-color", color) 
        .attr("stop-opacity", opacity); 
}  
var colorScale = d3.scale.linear().range([0, 100]).domain([spectra.min, spectra.max]);

function getColorScalePos(x){
    return Math.floor(colorScale(x));
}

setGradient(colGradient, "#4b0082", getColorScalePos(350), 0.8); //violet
setGradient(colGradient, "#00c9c9", getColorScalePos(445), 0.8); //blue
setGradient(colGradient, "#16e500", getColorScalePos(475), 0.8); //cyan
setGradient(colGradient, "#d7ea00", getColorScalePos(560), 0.8); //green
setGradient(colGradient, "#fcc100", getColorScalePos(600), 0.8); //yellow
setGradient(colGradient, "#ea0000", getColorScalePos(675), 0.8); //red
setGradient(colGradient, "#7f0800", getColorScalePos(800), 0.8); //dark red





//// LOADING DATA /////
var spectrum = [];
var allFilters = [];
var catalog = [];
var abInfo = []; 

d3.json("../data/json/spectra-min.json", function(error, dat1){
    spectrum = dat1;
    
    d3.json("../data/json/aria-min.json", function(error, dat2){
        allFilters['aria'] = dat2; 
        
        d3.json("../data/json/astrios-min.json", function(error, dat3){
            allFilters['astrios'] = dat3;           
                       
            d3.json("../data/json/fluoro_spectra_lookup.json", function(error, dat4){
                abInfo = dat4;
    
                d3.json("../data/json/LifeTechCatalog-min.json", function(error, dat5){
                    catalog = dat5;
                    // loadFilters('aria'); 
                    // loadSpectra('aria');
                    loadFilters('astrios'); 
                    loadSpectra('astrios');
                    loadAntibodies();     
                })
            });
        });
    });
});


 

var xScale = d3.scale.linear().range([0, bbLaser.w]).domain([spectra.min, spectra.max]);

function loadFilters(instr){
    var lasers = Object.keys(allFilters[instr]); //get array for all the lasers for an instrument
    for (var i = 0; i < lasers.length; i++){
        var filters = allFilters[instr][lasers[i]]; // get filters for each lasers
        
        // draw filter 
        svgSpectral.append("g")
            .attr("id", "laser"+lasers[i])
            .attr("transform", "translate(0," + bbLaser.h*i + ")")
            .selectAll("rect")
            .data(filters)
          .enter()
            .append("rect")
            .attr("class", "filter " + instr)
            .attr("y", 0)
            .attr("x", function(d){ return xScale( d[Object.keys(d)][0] ); })
            .attr("width", function(d){ return xScale(d[Object.keys(d)][1]) - xScale(d[Object.keys(d)][0]) ; })
            .attr("height", bbLaser.h);
    }
}




function loadSpectra(instr){
    var lasers = Object.keys(allFilters[instr]); //get array for all the lasers for an instrument
    for (var i = 0; i < lasers.length; i++){
        // loading fluorophores
        //var allFluorophore = Object.keys(spectrum);
        var allFluorophore = Object.keys(abInfo);
        var excitedByLaser = []; //fluorophore list that gets excited by laser, will sort list before drawing
        
        console.log(allFluorophore);
        for (var j = allFluorophore.length - 1; j >= 0; j--){
            if (!abInfo[allFluorophore[j]]['ex']){
                allFluorophore.splice(j, 1);
            }
        }
        
        console.log(allFluorophore);
        
        for (var j = 0; j < allFluorophore.length; j++){
            var exFl = abInfo[allFluorophore[j]]['ex']; 
            var ex = spectrum[exFl]["excitation"];
            
            // parse normalized excitation at laser wavelength
            var normEx = 0;
            for (var n in ex){
                if (ex[n][0] == lasers[i]){
                    normEx = parseFloat(ex[n][1]);
                }
            }
            
            // consider normalized excitation > 0.15 to be significant  
            if (normEx > 0.15){
                spectrum[exFl][lasers[i]] = normEx; // save normalized exicitation info for that fluorophore
                excitedByLaser.push(allFluorophore[j]);
            }
        }
        
        // console.log(excitedByLaser); // sort by emission spectra for panel viewer
        // excitedByLaser.sort(function(a, b){
        //     var exA = abInfo[a]['ex']; 
        //     var exB = abInfo[b]['ex']; 
        //     if (spectrum[exA].emMax[0] < spectrum[exB].emMax[0] ){ return -1;}
        //     if (spectrum[exA].emMax[0] > spectrum[exB].emMax[0] ){ return 1;}
        //     return 0; 
        // });
        // console.log(excitedByLaser);
        
        // sort by reverse normalized excitation (plot higher so everything is clickable)
        excitedByLaser.sort(function(a, b){
            var exA = abInfo[a]['ex']; 
            var exB = abInfo[b]['ex']; 
            if (spectrum[exA][lasers[i]] > spectrum[exB][lasers[i]] ){ return -1;}
            if (spectrum[exA][lasers[i]] < spectrum[exB][lasers[i]] ){ return 1;}
            return 0; 
        });
         
        for (var j in excitedByLaser){
            var exFl = abInfo[excitedByLaser[j]]['ex'];
            var emFl = abInfo[excitedByLaser[j]]['em'];
            
            var em = spectrum[emFl]["emission"];
            em.push([em[em.length - 1][0], "0"]); 
            em.unshift([em[0][0], "0"]);
            
            var normEx = spectrum[exFl][lasers[i]];
            
            var yScale = d3.scale.linear().range([bbLaser.h*normEx, 0]).domain([0, 1]);
            
            var emLine = d3.svg.line()
                .x(function(d) { return xScale(d[0]); })
                .y(function(d) { return yScale(d[1]); });
            
            d3.select("#laser"+lasers[i])
                .append("g")
                .attr("id", "fl"+i+j)
                .append("defs");
                    
            d3.select("#fl"+i+j) 
                .select("defs")
                .append("clipPath")
                .attr("id", "em"+i+j)
                .data([em])
              .enter()
                .append("g");
                        
            svgSpectral
                .select("#em" + i+j)
                .append("path")
                .attr("d", function(d) { return emLine(d); });
                    
            d3.select("#fl"+i+j).append("rect")
                    .attr("class", excitedByLaser[j])
                    .attr("fill", "url(#colorGradient)")
                    .attr("clip-path", "url(#em"+ i + j+ ")")
                    //.attr("x", 0)
                    .attr("transform", "translate(0," + bbLaser.h*(1-normEx) + ")")
                    .attr("width", bbLaser.w)
                    .attr("height", bbLaser.h*(i+1))
                    .on("mouseover", mouseover);
                          
        }
    }
}

function mouseover(){
    console.log(d3.select(this)[0]);
    console.log(d3.select(this)[0][0].className.baseVal);
    var selectedClass = d3.select(this)[0][0].className.baseVal;
}


// color scale bar
var svgSpecInfo = d3.select("#spectralViewerInfo")
                 .append("svg")
                 .attr("width", bbLaser.w)
                 .attr("height", 10);
                 
svgSpecInfo.append("rect")
     .attr("id", "")
     .attr("fill", "url(#colorGradient)")
     .attr("x", bbLaser.x)
     .attr("y", bbLaser.y)
     .attr("width", bbLaser.w)
     .attr("height", 50);





svgPanel.attr("x", bbLaser.x + 50);

// var svgPanel = d3.select("#panel")
//                  .append("svg")
//                  //.attr("width", 1000)
//                  .attr("height", bbLaser.h);

var colorScale2 = d3.scale.linear()
 .domain([350, 445, 475, 560, 600, 675, 800])
 .range(["#4b0082", "#00c9c9", "#16e500", "#d7ea00", "#fcc100", "#ea0000", "#7f0800"]);


function loadAntibodies(){
    var ab = Object.keys(catalog);
    console.log(catalog);
    
    var species = ['Human']; 
    var abSet = ['CD38', 'CD11c', 'CD34', 'CD4', 'CD8', 'OCLN', 'CD70'];
    
    for (var s in species){
        var abForSp = catalog[species[s]];
        for (var a in abSet){
            if (!abForSp[abSet[a]]){
                console.log("no antibody available for this marker: "+ abSet[a]);
            }
            else{
                console.log(abForSp[abSet[a]]);
                var marker = abForSp[abSet[a]];  // load ab from catalog
                var clones = Object.keys(marker); // get all clones    
            
                svgPanel.append('g')
                .attr('class', abSet[a])
                .attr('transform', 'translate('+ a*100 +',0)');
            
                for (var i = 0; i < clones.length; i++){
                    var fluors = marker[clones[i]]; //all fl in each clone        
            
                    //console.log(fluors);
                    fluors = sortByExEm(fluors);
                                
                    //console.log(fluors);                   
                                
                    //var c = clones[i];
                    d3.select('.'+ abSet[a])
                    //.data([clones[i]]) 
                    //.enter()
                    .append("g")
                    //.attr("class", function(d){ return "clone " + d; });
                
                    //d3.select('.clone '+ clones[i])
                    .selectAll(".fluor")
                    .data(fluors) 
                    .enter()
                    .append("rect")
                    .attr("class", function(d){ return "fluor " + d.name; })
                    .attr("fill", function(d){
                        //console.log(d);
                        var ab = abInfo[d.name];
                        //console.log(ab);
                        //console.log(ab.em);
                        //console.log(spectrum[ab['em']]);
                        if (ab['ex'] && ab['em']){
                            console.log(ab.em);
                            console.log(spectrum[ab['em']]['emMax'][0]);
                            return colorScale2(spectrum[ab['em']]['emMax'][0]);
                        }
                        else{
                            return "lightgrey";
                        }

                    })
                    .attr("transform", function(d, iter){ return "translate(" + i*20 + "," + iter*20 + ")"; })
                    .attr("width", 20)
                    .attr("height", 20)
            
                    //.attr("text", function(d){return d['conjugate']})
                    ;
            
            
                    // for (var item in marker[clones[i]]){
                //         console.log(  marker[clones[i]][item]['conjugate'] );
                //     }
                }
            }
        }   
            
        
       //  d3.selectAll('.' + abSet[ab])
       //  .data(abSet[ab])
       // .enter()
       //  .append('g')
       //  .attr('class', abSet[ab]);  
        
        
        
        
        
        // d3.select('.' + abSet[ab])
        // .
    }
   
    
}



function sortByExEm(fluors){    
    var colors = Object.keys(fluors);
    var unlabeled = [];
    var notAvailable = [];
    var toSort = [];
    
    for (var c in colors){
        var fl = colors[c];
        if (abInfo[fl]['ex'] && abInfo[fl]['em']){
            toSort.push( 
                {
                'name': fl,
                'catNo': fluors[colors[c]]['catNo'],
                'ex': abInfo[fl]['ex'], 
                'em': abInfo[fl]['em'], 
                'exMax': spectrum[ abInfo[fl]['ex'] ]['exMax'][0], 
                'emMax': spectrum[ abInfo[fl]['em'] ]['emMax'][0] 
                }
            );
        }        
        else if (abInfo[fl] == 'unlabeled'){
            unlabeled.push(
                {
                'name': fl,
                'catNo': fluors[colors[c]]['catNo'],
                'other': 'unlabeled', 
                }
            );
        }
        else {
            notAvailable.push(
                {
                'name': fl,
                'catNo': fluors[colors[c]]['catNo'],
                'other': colors[c] + ': spectral data N/A', 
                }
            );
        }

    }

    toSort.sort(function(a, b){
        if (a.emMax < b.emMax ){ return -1;}
        if (a.emMax > b.emMax ){ return 1;}
        return 0;
    });

    // console.log(toSort);
//     console.log(unlabeled);
//     console.log(notAvailable);
    
    return toSort.concat(unlabeled).concat(notAvailable);
    //return toSort;
}

