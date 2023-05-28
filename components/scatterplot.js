class Scatterplot {
    margin = {
        top: 10, right: 100, bottom: 40, left: 40
    }

    constructor(svg, tooltip, data, width = 250, height = 250) {
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
        this.container = this.svg.append("g");
        this.xAxis = this.svg.append("g");
        this.yAxis = this.svg.append("g");
        this.legend = this.svg.append("g");

        this.xScale = d3.scaleLinear();
        this.yScale = d3.scaleLinear();
        this.zScale = d3.scaleSequential(d3.interpolateOranges);

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
    }

    update(xVar, yVar, zVar, data, useColor) {
        this.data = data;
        this.xVar = xVar;
        this.yVar = yVar;
        this.zVar = zVar;

        this.xScale.domain(d3.extent(this.data, d => d[xVar])).range([0, this.width]);
        this.yScale.domain(d3.extent(this.data, d => d[yVar])).range([this.height, 0]);
        this.zScale.domain([0, d3.max(this.data, d => d[zVar])])

        this.circles = this.container.selectAll("circle")
            .data(data)
            .join("circle")
            .on("mouseover", (e, d) => {
                this.tooltip.select(".tooltip-inner")
                    .html(`${this.xVar}: ${d[this.xVar]}<br />${this.yVar}: ${d[this.yVar]}`);

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
            .on("mouseout", (d) => {
                this.tooltip.style("display", "none");
            });

        this.circles
            .transition()
            .duration(500)
            .attr("cx", d => this.xScale(d[xVar]))
            .attr("cy", d => this.yScale(d[yVar]))
            .attr("fill", useColor ? d => this.zScale(d[zVar]) : "black")
            .attr("r", 4)
            .attr("fill-opacity", 0.8)

        this.xAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.height})`)
            .transition()
            .duration(500)
            .call(d3.axisBottom(this.xScale));

        this.yAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
            .transition()
            .duration(500)
            .call(d3.axisLeft(this.yScale));

        if (useColor) {
            this.legend
                .attr("transform", `translate(${this.width + this.margin.left + 10}, ${30})`)
                .style("display", "inline")
                .style("font-size", "16px")
                .call(d3.legendColor()
                .scale(this.zScale)
                .cells(5)
                .orient('vertical'))
        }
        else {
            this.legend.style("display", "none");
        }
    }
}