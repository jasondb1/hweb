import React from 'react'
const usericon = require('../icons/user.png');

const Header = (props) => {
    return (
        <div id="header" className='row p-2'>

            <div className='col-12 d-flex'>
                    <div className='mr-auto d-inline-flex'>
                        <button className='btn btn-outline-primary btn-rounded btn-header'  onClick={props.toggleNavMenu}>
                            &#9776;
                        </button>
                        <h1 className='ml-3 mt-1'><span>home</span><span>Web</span></h1>
                    </div>
                    <div className=''>
                        {/* <span>Status Icons</span> */}
                    </div>
                    <div className=''>
                        <button className='btn btn-outline-primary btn-rounded btn-header'><img alt="" src={usericon} height='32' /></button>

                </div>
            </div>
        </div>

    )
};

export default Header
