class Histogram {
    margin = {
        top: 50, right: 10, bottom: 50, left: 40
    }

    constructor(svg, width = 250, height = 300) {
        this.svg = svg;
        this.width = width;
        this.height = height;
    }

    initialize() {
        this.svg = d3.select(this.svg);
        this.container = this.svg.append("g");
        this.xAxis = this.svg.append("g");
        this.yAxis = this.svg.append("g");
        this.legend = this.svg.append("g");

        this.xScale = d3.scaleBand();
        this.yScale = d3.scaleLinear();
        this.zScale = d3.scaleSequential(d3.interpolateRdYlBu)

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        this.svg.append("text")
            .attr("class", "histogram-title")
            .attr("x", this.width / 2 + this.margin.left)
            .attr("y", this.margin.top + this.height + this.margin.bottom - 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "20px")
            .text(`Magnitude`);
    }

    update(data, xVar) {
        const categories = Array.from({ length: 8 }, (_, i) => i + 1);
        const counts = {}

        categories.forEach(c => {
            counts[c] = data.filter(d => Math.floor(d[xVar]) === c).length;
        })

        this.xScale.domain(categories.concat(d3.max(categories) + 1)).range([0, this.width]);
        this.yScale.domain([0, d3.max(Object.values(counts))]).range([this.height, 0]);

        this.container.selectAll("rect")
            .data(categories)
            .join("rect")
            .attr("x", d => this.xScale(d) + this.xScale.bandwidth() / 2)
            .transition()
            .duration(500)
            .attr("y", d => this.yScale(counts[d]))
            .attr("width", this.xScale.bandwidth())
            .attr("height", d => this.height - this.yScale(counts[d]))
            .attr("fill", "lightgray")

        this.container.selectAll(".bar-label")
            .data(categories)
            .join("text")
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("fill", "black")
            .attr("class", "bar-label")
            .attr("x", d => this.xScale(d) + this.xScale.bandwidth())
            .transition()
            .duration(500)
            .attr("y", d => this.yScale(counts[d]) - 5)
            .text(d => counts[d])

        this.xAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.height})`)
            .call(d3.axisBottom(this.xScale))
            .attr("font-size", "13px");

        this.yAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
            .transition()
            .duration(500)
            .call(d3.axisLeft(this.yScale))
            .attr("font-size", "13px");

        this.container.selectAll(".total-count").remove();
        this.container.append("text")
            .attr("class", "total-count")
            .attr("x", this.width)
            .attr("y", -20)
            .attr("text-anchor", "end")
            .attr("font-size", "16px")
            .text(`Total Count: ${d3.sum(Object.values(counts))}`);
    }
}