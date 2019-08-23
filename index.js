let axios = require('axios')
const cheerio = require('cheerio')
const express = require('express')
var cors = require('cors')
const app = express()
const port = 3000

app.use(cors())

const URL = `https://www.moneycontrol.com/mutual-funds/nav/dsp-tax-saver-fund-regular/MDS060`

app.get('/', (req, Res) => {
    axios.get(URL)
            .then(res => res.data)
            .then(res => {
              const $ = cheerio.load(res)
              Res.json({
                  data: [{
                    nav: parseFloat($('span[class=amt]').text().substr(2, 6))
                  }],
                  status: "SUCCESS"
              })  
            })
})

app.listen(port || process.env.PORT, () => console.log(`App listening on port ${port}!`))