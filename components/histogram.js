class Histogram {
    margin = {
        top: 50, right: 10, bottom: 40, left: 40
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

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

    }

    update(data, xVar) {
        const categories = [...new Set(data.map(d => Math.floor(d[xVar])))].sort()
        const counts = {}

        categories.forEach(c => {
            counts[c] = data.filter(d => Math.floor(d[xVar]) === c).length;
        })
        
        this.xScale.domain(categories.concat(d3.max(categories) + 1)).range([0, this.width]);
        this.yScale.domain([0, d3.max(Object.values(counts))]).range([this.height, 0]);

        this.container.selectAll("rect")
            .data(categories)
            .join("rect")
            .attr("x", d => this.xScale(d) + this.xScale.bandwidth()/2)
            .attr("y", d => this.yScale(counts[d]))
            .attr("width", this.xScale.bandwidth())
            .attr("height", d => this.height - this.yScale(counts[d]))
            .attr("fill", "lightblue")
        
        this.container.selectAll(".bar-label")
            .data(categories)
            .join("text")
            .attr("class", "bar-label")
            .attr("x", d => this.xScale(d) + this.xScale.bandwidth())
            .attr("y", d => this.yScale(counts[d]) - 5)
            .text(d => counts[d])
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("fill", "black");

        this.xAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.height})`)
            .call(d3.axisBottom(this.xScale));

        this.yAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
            .call(d3.axisLeft(this.yScale));
        
        this.svg.selectAll(".histogram-title").remove(); // Remove existing title if any

        this.svg.append("text")
            .attr("class", "histogram-title")
            .attr("x", this.width / 2 + this.margin.left)
            .attr("y", this.margin.top + this.height + this.margin.bottom - 5)
            .attr("text-anchor", "middle")
            .text(`${xVar}`);
    }
}