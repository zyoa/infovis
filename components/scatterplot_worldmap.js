class ScatterplotMap {
    margin = {
        top: 0, right: 0, bottom: 0, left: 0
    }

    constructor(svg, tooltip, data, width = 1200, height = 600) {
        this.svg = svg;
        this.tooltip = tooltip;
        this.data = data;
        this.width = width;
        this.height = height;
        this.handlers = {};
    }

    initialize() {
        this.svg = d3.select(this.svg);
        this.tooltip = d3.select(this.tooltip);
        this.map = this.svg.append("g");
        this.container = this.svg.append("g");
        this.xAxis = this.svg.append("g");
        this.yAxis = this.svg.append("g");
        this.grid = this.svg.append("g");
        this.legend = this.svg.append("g");

        this.xScale = d3.scaleLinear();
        this.yScale = d3.scaleLinear();
        this.zScale = d3.scaleSequential(d3.interpolateRdYlBu);

        // https://d3-graph-gallery.com/graph/backgroundmap_basic.html
        const projection = d3.geoEquirectangular()
            .scale(this.width / (2 * Math.PI))
            .translate([this.width / 2 , this.height / 2])

        d3.json("https://raw.githubusercontent.com/zyoa/infovis/main/world.geojson").then(data => {
            this.map
                .selectAll("path")
                .data(data.features)
                .join("path")
                    .attr("fill", "#cccc")
                    .attr("d", d3.geoPath()
                        .projection(projection)
                    )
                    .style("stroke", "#000")
                    .style("stroke-width", "0.2")
        })

        // https://observablehq.com/@d3/zoomable-scatterplot
        this.xAxisf = (g, x) => g
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisTop(x).ticks(12))
            .call(g => g.select(".domain").attr("display", "none"))

        this.yAxisf = (g, y) => g
            .call(d3.axisRight(y).ticks(6))
            .call(g => g.select(".domain").attr("display", "none"))

        this.gridf = (g, x, y) => g
            .attr("stroke", "currentColor")
            .attr("stroke-opacity", 0.1)
            .call(g => g
                .selectAll(".x")
                .data(x.ticks(12))
                .join(
                    enter => enter.append("line").attr("class", "x").attr("y2", this.height),
                    update => update,
                    exit => exit.remove()
                )
                .attr("x1", d => 0.5 + x(d))
                .attr("x2", d => 0.5 + x(d)))
            .call(g => g
                .selectAll(".y")
                .data(y.ticks(6))
                .join(
                    enter => enter.append("line").attr("class", "y").attr("x2", this.width),
                    update => update,
                    exit => exit.remove()
                )
                .attr("y1", d => 0.5 + y(d))
                .attr("y2", d => 0.5 + y(d)))

        this.zoom = d3.zoom()
            .scaleExtent([1, 100])
            .on("zoom", ({transform}) => {
                this.currentZoom = transform
                
                const zx = transform.rescaleX(this.xScale).interpolate(d3.interpolateRound);
                const zy = transform.rescaleY(this.yScale).interpolate(d3.interpolateRound);

                this.container.attr("transform", transform);
                this.map.attr("transform", transform);
                this.xAxis.call(this.xAxisf, zx);
                this.yAxis.call(this.yAxisf, zy);
                this.grid.call(this.gridf, zx, zy);
            })
        
        this.svg.call(this.zoom)
        
        this.brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]])
            .on("start brush", (event) => {
                this.brushCircles(event);
            })
    }

    reset() {
        this.svg.transition().duration(750).call(
            this.zoom.transform, 
            d3.zoomIdentity
        )
        
        this.circles.classed("brushed", false)
        if (this.handlers.brush) {
            this.handlers.brush(this.data);
        }

        if (this.brushOn) {
            this.svg.selectAll("g.brush").remove()

            this.svg.append("g")
                .attr("class", "brush")
                .call(this.brush)
        }
    }

    // https://codepen.io/yappynoppy/pen/PgzLJM
    end_brush_tool() {
        this.brushOn = false
        this.svg.selectAll("g.brush").remove()
        this.svg.call(this.zoom)
    }
    
    start_brush_tool() {
        this.brushOn = true
        this.svg.append("g")
            .attr("class", "brush")
            .call(this.brush)
        
        this.svg.on(".zoom", null)
    }

    update(xVar, yVar, colorVar, useColor) {
        this.xVar = xVar;
        this.yVar = yVar;

        this.xScale.domain([-185, 185]).range([0, this.width]);
        this.yScale.domain([-90, 90]).range([this.height, 0]);
        this.zScale.domain([d3.max(this.data.map(d => d[colorVar])) - 1.5, d3.min(this.data.map(d => d[colorVar]))])

        this.circles = this.container.selectAll("circle")
            .data(data)
            .join("circle")
            .on("mouseover", (e, d) => {
                this.tooltip.select(".tooltip-inner")
                    .html(`Latitude: ${d.latitude}
                    Longitude: ${d.longitude}
                    Mag: ${d.mag}`);

                Popper.createPopper(e.target, this.tooltip.node(), {
                    placement: 'top',
                    modifiers: [
                        {
                            name: 'arrow',
                            options: {
                                element: this.tooltip.select(".tooltip-arrow").node(),
                            },
                        },
                    ],
                });

                this.tooltip.style("display", "block");
            })
            .on("mouseout", () => {
                this.tooltip.style("display", "none");
            });

        this.circles
            .transition()
            .attr("cx", d => this.xScale(d[xVar]))
            .attr("cy", d => this.yScale(d[yVar]))
            .attr("fill", useColor ? d => this.zScale(d[colorVar]) : "black")
            .attr("r", 2)
            .attr("opacity", 0.6)

        if (useColor) {
            this.legend
                .attr("transform", `translate(${this.width - 270}, ${15})`)
                .style("display", "inline")
                .style("font-size", "12px")
                .call(d3.legendColor()
                    .scale(this.zScale)
                    .shapeWidth(30)
                    .cells(8)
                    .orient('horizontal'))
        }
        else {
            this.legend.style("display", "none");
        }
    }

    isBrushed(d, selection) {
        let [[x0, y0], [x1, y1]] = selection; // destructuring assignment
        let x = this.xScale(d[this.xVar]);
        let y = this.yScale(d[this.yVar]);

        return x0 <= x && x <= x1 && y0 <= y && y <= y1;
    }

    // this method will be called each time the brush is updated.
    brushCircles(event) {
        let {selection} = event;
        const {x, y, k} = this.currentZoom;

        const transformedSelection = [
            [(selection[0][0] - x) / k, (selection[0][1] - y) / k],
            [(selection[1][0] - x) / k, (selection[1][1] - y) / k]
        ];
        
        this.circles.classed("brushed", d => this.isBrushed(d, transformedSelection));
    
        if (this.handlers.brush) {
            this.handlers.brush(this.data.filter(d => this.isBrushed(d, transformedSelection)));
        }
    }

    on(eventType, handler) {
        this.handlers[eventType] = handler;
    }
}