var margin = 20,
    diameter = 960;

var circle = undefined,
    text = undefined;
    

/* Initialize tooltip */
tip = d3.tip().attr('class', 'd3-tip').html(showDetails);

function showDetails(d) {
    var content = '<p class="tip">' + d.className + '</p>';
    content += '<hr class="tooltip-hr">';
    content += '<p class="tip">' + d.dn + '</p>';
    return content;
}

var color = d3.scale.linear()
    .domain([1, 5])
    .range(["hsl(220,93.94%,71.96%)", "hsl(220,37.64%,19.4%)"])
    .interpolate(d3.interpolateHcl);

var leaf_color = d3.scale.category20()

var pack = d3.layout.pack()
    .padding(2)
    .size([diameter - margin, diameter - margin])
    .value(function(d) { return 1 / d.depth });

var zoommer = d3.behavior.zoom()
    .scaleExtent([1, 10])
    .on("zoom", zoomed);
    
var drag = d3.behavior.drag()
    .origin(function(d) { return d; })
    .on("dragstart", dragstarted)
    .on("drag", dragged)
    .on("dragend", dragended);
    
var svg = d3.select(".main").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
  .append("g")
    .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")")
    .call(zoommer)
    .call(drag);

    svg.call(tip);
    // svg.call(drag);
    
var container = svg.append("g");
    
var files = $('#file-select').on("change", function (e) {
    var file = e.target.value;
    console.log("f",file);
    d3.json("examples/" + file, function(error, root) {
        if (error) throw error;
        circles.remove();
        text.remove();
        updatePack(root);
    });
});

function zoomed() {
  container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

function dragstarted(d) {
  d3.event.sourceEvent.stopPropagation();
  d3.select(this).classed("dragging", true);
}

function dragged(d) {
  d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
}

function dragended(d) {
  d3.select(this).classed("dragging", false);
}

function updatePack(root) {
    var focus = root,
        nodes = pack.nodes(root),
        view;

    // Fix the header and nav pane
    $('.page-header').html(root.className + ": " + root.name);
    updateNav(root);

    circles = container.selectAll("circle")
    .data(nodes)
    .attr("rInit", function (d, i) { return d.r} );
    
    circles.enter().append("circle")
        .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
        .attr("rInit", function (d) { return d.r })
        .style("fill", function(d) { return d.children ? color(d.depth) : leaf_color(d.className); })
        .on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); })
        .on("mouseover", nodeHoverOn)
        .on("mouseout", nodeHoverOff);

    text = container.selectAll("text")
        .data(nodes)
      .enter().append("text")
        .attr("class", "label")
        .style("fill-opacity", function(d) { return  d.parent === root ? 1 : 0; })
        .style("display", function(d) { return d.parent === root ? null : "none"; })
        .style("font-size", function(d) {
              var len = d.className.substring(0, d.r / 3).length;
              var size = d.r/3;
              size *= 10 / len;
              size += 1;
              return Math.round(size)+'px';
          })
          .text(function(d) {
              var text = d.className.substring(0, d.r / 3);
              return text;
          });

    var node = container.selectAll("circle,text");

    d3.select("body")
        .style("background", color(-1))
    .on("click", function() { zoom(root); });

    zoomTo([root.x, root.y, root.r * 2 + margin]);

    function zoom(d) {
      var focus0 = focus; focus = d;

      $('.page-header').html(d.className + ": " + d.name);
      updateNav(d);

      var transition = d3.transition()
          .duration(d3.event.altKey ? 7500 : 750)
          .tween("zoom", function(d) {
            var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
            return function(t) { zoomTo(i(t)); };
          });

      transition.selectAll("text")
        .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
          .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
          .each("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
          .each("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
    }

    function zoomTo(v) {
      var k = diameter / v[2]; view = v;
      node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
      circles.attr("r", function(d) { return d.r * k; });
    }

    function updateNav(d) {
        var result = [];
        var dn = d.dn;
        var depth = d.depth;

        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.depth === (depth+1) && node.dn.startsWith(dn)) {
                result.push(nodes[i]);
            }
        }

        d3.select('ul.nav-sidebar').selectAll('li').remove();
        var nav = d3.select('ul.nav-sidebar').selectAll('li')
                  .data(result)
                  .enter().append('li').append('a')
                    .on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation() })
                    .on("mouseover", navHoverOn)
                    .on("mouseout", navHoverOff)
                    .html(function (d) { return d.className;});
    }

    function navHoverOn(d) {
        // Find which <li> you're on and set active
        var selectedNavDn = d.dn;
        var navList = $('ul.nav-sidebar li');
        for (var i = 0; i < navList.length; i++) {
            var navListItem = navList.eq(i);
            var navItemDn = navListItem[0].__data__.dn;
            if (navItemDn === selectedNavDn) {
                navListItem.attr('class', 'active');
            }
        }
    
        // Find which <circle> is associated and highlight it
        for (var i = 0; i < circles[0].length; i++) {
            var circleDn = circles[0][i].__data__.dn;
            if (circleDn === selectedNavDn) {
                var selectedCircle = circles[0][i];
                selectedCircle.style.stroke = '#000';
                selectedCircle.style.strokeWidth = '2px';
            }
        }
    
    }

    function navHoverOff(d) {
        var selectedNavDn = d.dn;
        // Find which <li> you're leaving to remove active
        var navList = $('ul.nav-sidebar li');
        for (var i = 0; i < navList.length; i++) {
            var navListItem = navList.eq(i);
            var navItemDn = navListItem[0].__data__.dn;
            if (navItemDn === selectedNavDn) {
                navListItem.removeAttr('class', 'active');
            }
        }
    
        // Find which <circle> is associated and highlight it
        for (var i = 0; i < circles[0].length; i++) {
            var circleDn = circles[0][i].__data__.dn;
            if (circleDn === selectedNavDn) {
                var selectedCircle = circles[0][i];
                selectedCircle.style.stroke = '';
                selectedCircle.style.strokeWidth = '';
            }
        }
    
    }

    function nodeHoverOn(d) {
        tip.show(d);
        var selectedCircle = d3.select(d)[0][0];
        console.log(selectedCircle);
        console.dir(d3.select(d));
        var selectedDn = selectedCircle.dn;
        // console.log('dn',selectedDn);
        var navList = $('ul.nav-sidebar li');
        for (var i = 0; i < navList.length; i++) {
            var navListItem = navList.eq(i);
            var navItemDn = navListItem[0].__data__.dn;
            if (navItemDn === selectedDn) {
                navListItem.attr('class', 'active');
            }
        }
    }

    function nodeHoverOff(d) {
        tip.hide(d);
        var selectedDn = d3.select(d)[0][0].dn;
        var navList = $('ul.nav-sidebar li');
        for (var i = 0; i < navList.length; i++) {
            var navListItem = navList.eq(i);
            var navItemDn = navListItem[0].__data__.dn;
            if (navItemDn === selectedDn) {
                navListItem.removeAttr('class', 'active');
            }
        }
    }
}

d3.json("examples/l3out_children.json", function(error, root) {
  if (error) throw error;
  updatePack(root);
});

d3.select(self.frameElement).style("height", diameter + "px");