// MathJax config
MathJax.Hub.Config({
    extensions: ["tex2jax.js"],
    jax: ["input/TeX", "output/HTML-CSS"],
    tex2jax: {
        inlineMath: [['$', '$'], ["\\(", "\\)"]],
        displayMath: [['$$', '$$'], ["\\[", "\\]"]],
        processEscapes: true
    },
    // "HTML-CSS": { fonts: ["TeX"] }
});

// ARCH model generating function
async function arch(theta1, theta2) {
    numDataPoints = 100

    y_p = 0
    e_p = await randn()

    y = []

    for (i = 0; i < numDataPoints; ++i) {
        e_p = (await randn()) * Math.sqrt(0.2 + theta2 * (e_p ** 2))
        y_p = theta1 * y_p + e_p

        y.push(y_p)
    }

    return y
}

// create the view-model, which only has
//  the ARCH model parameters in it
var vm = {
    theta1: ko.observable(50),
    theta2: ko.observable(50),
};

vm.theta1_actual = ko.computed(
    () => vm.theta1() / 50 - 1
)

vm.theta1_rounded = ko.computed(
    () => Math.round(vm.theta1_actual() * 100) / 100
)

vm.theta2_actual = ko.computed(
    () => vm.theta2() / 100
)

vm.theta2_rounded = ko.computed(
    () => Math.round(vm.theta2_actual() * 100) / 100
)

// setup chart generation
// data chart

var archData = $('#arch-data')
var archDataChart = new Chart(archData, {
    type: 'scatter',
    options: {
        responsive: false,
        scales: {
            yAxes: [{
                display: true,
                stacked: true,
                // ticks: {
                    // min: -5, // minimum value
                    // max: 5 // maximum value
                // }
            }]
        }
    },
    data: {
        datasets: [{
            data: [{ x: 0, y: 10 }],
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: '#1f77b4',
            pointBackgroundColor: '#1f77b4',
            radius: 2,
            borderWidth: 2,
            showLine: true,
            fill: false,
            label: 'ARCH data'
        }]
    }
})

var theta1Chart = new Chart($('#lfire-theta1'), {
    type: 'scatter',
    options: {
        responsive: false,
        scales: {
            yAxes: [{
                display: true,
                stacked: true,
                // ticks: {
                //     min: 0, // minimum value
                //     max: 0.6 // maximum value
                // }
            }]
        }
    },
    data: {
        datasets: [{
            data: [{ x: 0, y: 10 }],
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: '#1f77b4',
            pointBackgroundColor: '#1f77b4',
            radius: 0,
            borderWidth: 2,
            showLine: true,
            fill: false,
            label: 'Theta 1'
        }]
    }
})
var theta2Chart = new Chart($('#lfire-theta2'), {
    type: 'scatter',
    options: {
        responsive: false,
        scales: {
            yAxes: [{
                display: true,
                stacked: true,
                // ticks: {
                //     min: 0, // minimum value
                //     max: 0.6 // maximum value
                // }
            }]
        }
    },
    data: {
        datasets: [{
            data: [{ x: 0, y: 10 }],
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: '#1f77b4',
            pointBackgroundColor: '#1f77b4',
            radius: 0,
            borderWidth: 2,
            showLine: true,
            fill: false,
            label: 'Theta 2'
        }]
    }
})


async function plotGenerated() {
    var data = await arch(vm.theta1_actual(), vm.theta2_actual())
    var chartData = data.map((e, i) => {
        return {
            x: i,
            y: e
        }
    })

    archDataChart.data.datasets[0].data = chartData
    archDataChart.update()

    vm.data = data
    infer(vm.data).then((pred) => {

        lfire_probs = estimate_probs(pred, lfire_coefs)
        sum = nj.sum(lfire_probs)

        probs_1 = []
        probs_2 = []
        for (i = 0; i < 20; ++i) {

            _s = 0
            _s2 = 0
            for (j = 0; j < 20; ++j) {
                _s += lfire_probs[j][i] / sum
                _s2 += lfire_probs[i][j] / sum
            }
            probs_2.push(_s)
            probs_1.push(_s2)
        }

        var chartData = probs_1.map((e, i) => {
            return {
                x: i / 10 - 1,
                y: e
            }
        })

        theta1Chart.data.datasets[0].data = chartData
        theta1Chart.update()

        var chartData = probs_2.map((e, i) => {
            return {
                x: i / 20,
                y: e
            }
        })
        theta2Chart.data.datasets[0].data = chartData
        theta2Chart.update()

    })
}

// call stuff
var model = undefined,
    x_mean = 0,
    x_std = 1,
    y_mean = 0,
    y_std = 1,
    lfire_coefs = undefined;

function infer(data) {

    // console.log(x_mean, x_std, y_mean, y_std)

    data = nj.array(data)
    data = data.subtract(x_mean).divide(x_std)
    // console.log(data.tolist(), data.subtract(x_mean).tolist())

    res = model.predict(tf.tensor3d(data.tolist(), [1, 100, 1]))
    return new Promise((resolve, reject) => {
        res.data().then((pred) => {
            pred = Array.from(pred)
            // console.log(nj.array(pred).subtract([0,0]).tolist(), y_mean)
            resolve(
                nj.array(pred).multiply(y_std).add(y_mean).tolist()
            )
        });
    });
}

function dot(x1, x2) {
    res = 0
    for (var i in x1)
        res += x1[i] * x2[i]
    return res
}

function estimate_probs(data, coefs) {
    var data = [
        data[0],
        data[1],
        data[0] * data[0],
        data[1] * data[1],
        data[0] * data[1]
    ];

    probs = []
    idx = 0
    for (t1 = 0; t1 < 20; ++t1) {
        probs_t1 = []
        for (t2 = 0; t2 < 20; ++t2) {
            probs_t2 = []
            _coef = coefs[idx]
            idx += 1

            p = Math.exp(
                dot(data, _coef.slice(1)) + _coef[0]
            )
            probs_t1.push(p)
        }
        probs.push(probs_t1)
    }

    return probs
}


tf.loadModel('/pages/research/lfire/data/arch/tjs/model.json').then((res) => {
    model = res

    // lfire coefficients
    $.getJSON('/pages/research/lfire/data/arch/lfire_coefficients.json', (res) => {
        lfire_coefs = res;

        // standardization
        $.getJSON('/pages/research/lfire/data/arch/neural_network_standardization.json', (res) => {
            x_mean = res[0]
            x_std = res[1]
            y_mean = res[2]
            y_std = res[3]

            ko.applyBindings(vm, $('innerpage')[0])

            vm.theta1(30)
            vm.theta2(85)
            vm.theta1.subscribe(plotGenerated)
            vm.theta2.subscribe(plotGenerated)

            plotGenerated()
        })
    })
})