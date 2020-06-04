import React, { Component } from 'react';
import './Chart.css';
import { getAuthSocket } from "../services/socket";
import * as d3 from 'd3';

//let CHART_WIDTH = 600;
//let CHART_HEIGHT = 400;
//const UPDATE_INTERVAL = 5 * 60 * 1000 // 5 minute intervals;


function drawLineChart(data, chartWidth, chartHeight, chartId) {
console.log(chartId);

   // set the dimensions and margins of the graph
let margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = chartWidth - margin.left - margin.right,
    height = chartHeight - margin.top - margin.bottom;

// set the ranges
let x = d3.scaleTime().range([0, width]);
let y = d3.scaleLinear().range([height, 0]);

// define the line
let valueline = d3.line()
    .x(function(d) { return x(d.timestamp); })
    .y(function(d) { return y(d.value); });


//remove old chart
    d3.select("#" + chartId + ' svg').remove()

// append the svg obgect to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
let svg = d3.select("#" + chartId).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

// Get the data

  // format the data
  data.forEach(function(d) {
      d.timestamp = new Date(d.timestamp);
      d.value= +d.value;
  });

  // Scale the range of the data
  x.domain(d3.extent(data, function(d) { return d.timestamp; }));
  y.domain([d3.min(data, function(d) {return d.value - 2}), d3.max(data, function(d) { return d.value + 2; })]);

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


class Chart extends Component {

    constructor(props) {
        super(props);

        this.state = {
            label: 'Chart',
            component: 'unknown',
            data: {},
            chartWidth: 600,
            chartHeight: 400,
            chartId: "chart",
            //sensor: this.props.sensor,
        };
    }

    componentDidMount() {

        this.socket = getAuthSocket();
        
        this.socket.emit('requestData', {sensor:this.props.sensor, timeback:1440} );
        
        //retrieve data
        this.socket.on('incomingData', (payload) => {
            this.setState({ data: payload });
            drawLineChart(this.state.data, this.state.chartWidth, this.state.chartHeight, this.props.sensor);
        });
    }

    componentWillUnmount() {
        this.socket.close();
    }

    setSensor (sensor) {
        this.setState({sensor: sensor});
    }

    handleClickButton(value){
        this.socket.emit('requestData', {sensor:this.props.sensor, timeback:value} );
    }

    render() {
        return ( <div id={this.props.sensor}>
            {/* <svg id = "visualisationi"
            width = "600"
            height = "400"> 
            </svg>  */}
                {/*</div>
            <div>*/}
                <button style={{padding: "0.3em", marginLeft: "0.7em", width: "6em" }}
                        onClick={this.handleClickButton.bind(this, 10080)}
                >1 week
                </button>
                <button style={{padding: "0.3em", marginLeft: "0.7em", width: "6em" }}
                        onClick={this.handleClickButton.bind(this, 1440)}
                >24 hours
                </button>
                <button style={{padding: "0.3em", marginLeft: "0.7em", width: "6em" }}
                    onClick={this.handleClickButton.bind(this, 720)}
                >12 hour
                </button>
                <button style={{padding: "0.3em", marginLeft: "0.7em", width: "6em" }}
                    onClick={this.handleClickButton.bind(this, 360)}
                >6 hour
                </button>
                <button style={{padding: "0.3em", marginLeft: "0.7em", width: "6em" }}
                    onClick={this.handleClickButton.bind(this, 60)}
                >1 hour</button>
                <br/>
            </div>
        );
    }
}

export default Chart;
