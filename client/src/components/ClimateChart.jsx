import React, { Component } from 'react';
import './ClimateChart.css';
import { getAuthSocket } from "../services/socket";
import * as d3 from 'd3';

let CHART_WIDTH = 600;
let CHART_HEIGHT = 400;

let data = [
    {date:"2019-11-03 16:01:17",close:"16.5"},
    {date:"2019-11-03 16:02:17",close:"18.0"},
    {date:"2019-11-03 16:03:17",close:"19.0"},
    {date:"2019-11-03 16:04:17",close:"20.50"},
    {date:"2019-11-03 16:05:17",close:"21.2"}
];

function drawChart() {

   // set the dimensions and margins of the graph
let margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = CHART_WIDTH - margin.left - margin.right,
    height = CHART_HEIGHT - margin.top - margin.bottom;

// parse the date / time
//let parseTime = d3.timeParse("%H:%M");
let parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
//let parseTime = d3.timeParse("%d-%b-%y");

// set the ranges
let x = d3.scaleTime().range([0, width]);
let y = d3.scaleLinear().range([height, 0]);

// define the line
let valueline = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.close); });

// append the svg obgect to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
let svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

// Get the data
// d3.csv("data.csv", function(error, data) {
//   if (error) throw error;

  // format the data
  data.forEach(function(d) {
      d.date = parseTime(d.date);
      d.close = +d.close;
  });

  // Scale the range of the data
  x.domain(d3.extent(data, function(d) { return d.date; }));
  y.domain([0, d3.max(data, function(d) { return d.close; })]);

  // Add the valueline path.
  svg.append("path")
      .data([data])
      .attr("class", "line")
      .attr("d", valueline);

  // Add the X Axis
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

  // Add the Y Axis
  svg.append("g")
      .call(d3.axisLeft(y));

//});
}


class ClimateChart extends Component {

    constructor(props) {
        super(props);

        this.state = {
            label: 'Door Sensor',
            isOpen: props.isOpen,
            component: 'doorSensor'
        };
    }

    componentDidMount() {

        this.socket = getAuthSocket();

        //TODO: Change this to get temp data
        this.socket.on('componentStatusUpdate', (data) => {
            if (data.component === this.state.component) {
                this.setState({ isOpen: data.isOpen });
            }
        });

        drawChart();

    }

    componentWillUnmount() {
        this.socket.close();
    }

    render() {
        return ( <div id="chart">
            {/* <svg id = "visualisation"
            width = "600"
            height = "400"> 
            </svg>  */}
            </div>
        );
    }
}

export default ClimateChart;