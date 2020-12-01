const { deflate, unzip } = require('zlib')
const {promisify} = require('util')
const INPUT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque sed mollis quam. Curabitur pretium maximus risus sit amet volutpat. Nullam facilisis pretium diam non dictum. Pellentesque eu nulla finibus felis pretium lacinia a at orci. Nulla facilisi. Aliquam gravida sollicitudin turpis, eget tincidunt velit. Morbi nec turpis nec risus sollicitudin euismod. Duis iaculis risus non dolor blandit semper. In porttitor suscipit nisl a sodales.

Maecenas pharetra in ligula et ullamcorper. Duis egestas vulputate quam, a efficitur eros. Nunc id ligula eleifend, blandit sapien et, pellentesque est. Cras consequat lorem eget aliquam tincidunt. Morbi placerat dapibus eros, sed egestas nisl euismod eu. Sed aliquet scelerisque varius. Praesent sollicitudin dignissim nunc, at fringilla ipsum laoreet eu.

Cras bibendum nulla ut tristique consequat. Duis egestas enim sed varius porttitor. Aliquam at blandit nulla. Proin accumsan risus vitae lobortis rutrum. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Sed placerat mi eget ligula venenatis, ac consequat enim lobortis. Maecenas vel semper nisl, ac pulvinar orci. Vivamus quis ligula vel ligula ornare ullamcorper. Aenean in nisl nec massa blandit placerat. Aliquam semper rutrum lectus eget facilisis. Maecenas semper, mauris nec euismod malesuada, erat diam viverra arcu, ac sagittis purus neque in justo.

Duis eleifend felis metus, molestie fermentum libero porta eu. Nam nec turpis feugiat, vehicula nisl et, volutpat ante. Aenean non lacus quis nulla commodo tincidunt. Integer lacus nisi, auctor sed venenatis ac, venenatis in mi. Proin eu turpis eget dui condimentum malesuada. In ultrices augue est, sed eleifend ante ultrices hendrerit. Mauris elementum fringilla tortor, at congue libero dapibus non. Vivamus tempus vulputate mauris ac euismod. Vestibulum aliquam elit a tincidunt pharetra. In eu iaculis ipsum. Etiam feugiat, purus eget convallis blandit, turpis mauris posuere neque, ac pulvinar elit sapien vel velit. Morbi placerat semper mi, id semper augue bibendum vel. Ut et maximus arcu.

Integer finibus diam eu ipsum porttitor, ac placerat elit iaculis. Curabitur varius varius elit, at euismod massa ultricies at. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi condimentum rhoncus enim eget imperdiet. Vivamus convallis, elit quis varius porta, turpis urna aliquet ex, quis fringilla mi enim ut elit. Pellentesque ac ipsum luctus quam egestas iaculis eu vel ex. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`

const compress = promisify(deflate)
const do_unzip = promisify(unzip)

compress(INPUT).then(buffer => {
    console.log(`${INPUT.length}:${buffer.toString('base64').length}`)
    do_unzip(buffer).then(val => console.log(INPUT === val.toString()))
})