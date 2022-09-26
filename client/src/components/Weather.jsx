import React, { Component } from 'react';

class Weather extends Component {



    render() {
        return (<div className='Climate'>
            <h1>Weather</h1>
            <iframe title="Environment Canada Weather" width="287px" height="191px" src="https://weather.gc.ca/wxlink/wxlink.html?cityCode=ab-52&amp;lang=e" allowtransparency="true" frameborder="0"></iframe>
        </div>
        )
    };

}

export default Weather;
