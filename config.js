module.exports = {
    port: process.env.PORT || 30002,
    database: 'mongodb://adminds:password1@ds137267.mlab.com:37267/smart-connections',
    
    //database: 'mongodb://localhost/smart-connections',

    secret: 'aDrOiTmInDsSoFtWaReLaBsKiNfRaKaZhAkUtTaM',
    sparkpostKey:'cc6d4a18df7bed49a34989f73a006ddc1a7eef7d',
    twilio : {
    	accountSid: 'AC1a4563304a5722b5be786629cdb37724',
        authToken: '21ef12f26890099f514c379c8c580015'
    },
    firbaseServerKey:'AIzaSyBA4JTOqUaSMVp6FAur1sVXSc1x_TIm6EY'
}
