import React from 'react'
const usericon = require('../icons/user.png'); // with require

const Header = (props) => {
    return (
        <div id="header" className='row p-2'>

            <div className='col-12 d-flex'>
                    <div className='mr-auto d-inline-flex'>
                        <button className='btn btn-outline-info btn-rounded'  onClick={props.toggleNavMenu}>
                            &#9776;
                        </button>
                        <h1 className='ml-2 mt-1'>homeWeb</h1>
                    </div>
                    <div className=''>
                        {/* <span>Status Icons</span> */}
                    </div>
                    <div className=''>
                        <button className='btn btn-outline-info btn-rounded'><img alt="" src={usericon} height='32' /></button>

                </div>
            </div>
        </div>

    )
};

export default Header
