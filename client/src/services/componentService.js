const baseAPI = '/api';

const homewebService = {

    getStatus() {
        return new Promise((resolve, reject) => {
            fetch(`${baseAPI}/status`)
                .then(response => response.json())
                .then(json => resolve(json))
                .catch(err => {
                    reject(err);
                });
        });
    },

    getComponentState(component) {
        return new Promise((resolve, reject) => {
            fetch(`${baseAPI}/component/${component}`)
                .then(response => response.json())
                .then(json => resolve(json))
                .catch(err => {
                    reject(err);
                });
        });
    },

    componentOn(component) {
        return new Promise((resolve, reject) => {
            fetch(`${baseAPI}/component_on/${component}`, {
                method: 'POST',
                body: JSON.stringify({}),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            })
                //.then(response => response.json())
                .then(result => resolve(result))
                .catch(err => {
                    reject(err);
                });
        });
    },

    componentOff(component) {
        return new Promise((resolve, reject) => {
            fetch(`${baseAPI}/component_off/${component}`, {
                method: 'POST',
                body: JSON.stringify({}),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            })
                //.then(response => response.json())
                .then(result => resolve(result))
                .catch(err => {
                    reject(err);
                });
        });
    },

    ledOn() {
        return new Promise((resolve, reject) => {
            fetch(`${baseAPI}/led_on`)
                .then(response => response.json())
                .then(json => resolve(json))
                .catch(err => {
                    reject(err);
                });
        });
    },

    ledOff() {
        return new Promise((resolve, reject) => {
            fetch(`${baseAPI}/led_off`)
                .then(response => response.json())
                .then(json => resolve(json))
                .catch(err => {
                    reject(err);
                });
        });
    },

    // create(hero) {
    //   return new Promise((resolve, reject) => {
    //     fetch(`${baseAPI}/hero`, {
    //       method: 'PUT',
    //       body: JSON.stringify(hero),
    //       headers: {
    //         Accept: 'application/json',
    //         'Content-Type': 'application/json'
    //       }
    //     })
    //       .then(result => result.json())
    //       .then(json => resolve(json))
    //       .catch(err => {
    //         reject(err);
    //       });
    //   });
    // },
    //
    // update(hero) {
    //   return new Promise((resolve, reject) => {
    //     fetch(`${baseAPI}/hero`, {
    //       method: 'POST',
    //       body: JSON.stringify(hero),
    //       headers: {
    //         Accept: 'application/json',
    //         'Content-Type': 'application/json'
    //       }
    //     })
    //       .then(result => {
    //         resolve(result);
    //       })
    //       .catch(err => {
    //         reject(err);
    //       });
    //   });
    // },
    //
    // destroy(hero) {
    //   return new Promise((resolve, reject) => {
    //     fetch(`${baseAPI}/hero/${hero.id}`, { method: 'DELETE' })
    //       .then(response => response.json())
    //       .then(json => resolve(json))
    //       .catch(err => {
    //         reject(err);
    //       });
    //   });
    // }
};

export default homewebService;
