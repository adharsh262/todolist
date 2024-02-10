const format = require('date-fns/format')
noeDaete = '2020-1-22'
const da = format(new Date(noeDaete), 'yyyy-MM-dd')
console.log(da)
