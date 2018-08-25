const express = require('express');
const router = express.Router();
const moment = require('moment');
const request = require('request');

const apiKeyGonggong_SILHWANG = require('../../../config/secretKey').apiKeyGonggong_SILHWANG;
const apiKeyGonggong_MISAE = require('../../../config/secretKey').apiKeyGonggong_MISAE;

/* GET home page. */
router.get('/', async (req, res, next) => {

    let local; //지역구
    let temper; //온도
    let humidity; //습도
    let land_weather; //대기상태
    let fine_dust; //미세먼지


    //입력: 지역구
    try {
        local = req.query.local || "서울";

        /*
        ***** 실시간 실황정보 *****
        입력: 키, 오늘날짜, 기준시간, 예보지점 X좌표, 예보지점 Y좌표, 한페이지, 페이지번호, 타입(JSON)
         */

        //url
        let url = "http://newsky2.kma.go.kr/service/SecndSrtpdFrcstInfoService2/ForecastGrib";

        //고정 변수
        let today = moment().format("YYYYMMDD");
        let time = (new Date()).getMinutes() >= 45 ? (new Date()).getHours() : (new Date()).getHours() - 1;
        let type = 'json';

        //구해야할 변수
        let nx;
        let ny;

        console.log(today, time);

        //사용자가 위치 정보 수집을 동의하지 않았을 때
        if (local === "서울") {
            nx = 60;
            ny = 127;
        }

        //사용자가 위치 정보 수집을 동의했을 때
        else {
            switch (local) {
                case "종로구":
                    nx = 60;
                    ny = 127;
                    break;
                case "중구":
                    nx = 60;
                    ny = 127;
                    break;
                case "용산구":
                    nx = 60;
                    ny = 126;
                    break;
                case "성동구":
                    nx = 61;
                    ny = 127;
                    break;
                case "광진구":
                    nx = 62;
                    ny = 126;
                    break;
                case "동대문구":
                    nx = 61;
                    ny = 127;
                    break;
                case "중랑구":
                    nx = 62;
                    ny = 128;
                    break;
                case "성북구":
                    nx = 61;
                    ny = 127;
                    break;
                case "강북구":
                    nx = 61;
                    ny = 128;
                    break;
                case "도봉구":
                    nx = 61;
                    ny = 129;
                    break;
                case "노원구":
                    nx = 61;
                    ny = 129;
                    break;
                case "은평구":
                    nx = 59;
                    ny = 127;
                    break;
                case "서대문구":
                    nx = 59;
                    ny = 127;
                    break;
                case "마포구":
                    nx = 59;
                    ny = 127;
                    break;
                case "양천구":
                    nx = 58;
                    ny = 126;
                    break;
                case "강서구":
                    nx = 58;
                    ny = 126;
                    break;
                case "구로구":
                    nx = 58;
                    ny = 125;
                    break;
                case "금천구":
                    nx = 58;
                    ny = 124;
                    break;
                case "영등포구":
                    nx = 58;
                    ny = 126;
                    break;
                case "동작구":
                    nx = 59;
                    ny = 125;
                    break;
                case "관악구":
                    nx = 59;
                    ny = 125;
                    break;
                case "서초구":
                    nx = 61;
                    ny = 125;
                    break;
                case "강남구":
                    nx = 61;
                    ny = 126;
                    break;
                case "송파구":
                    nx = 62;
                    ny = 126;
                    break;
                case "강동구":
                    nx = 62;
                    ny = 126;
                    break;
                default:
                    nx = 60;
                    ny = 127;

            }
        }

        let option = {
            uri:`${url}?serviceKey=${apiKeyGonggong_SILHWANG}&base_date=${today}&base_time=${time + "00"}&nx=${nx}&ny=${ny}&_type=${type}`,
            method: "GET"
        };

        request(option, (err, resp, body) => {

            //현재 실황 데이터 !!!
            console.log(body);
            let silhwangData = JSON.parse(body);

            /*
            ***** 실시간 미세먼지정보 *****
            입력: 키, 오늘날짜, 기준시간, 예보지점 X좌표, 예보지점 Y좌표, 한페이지, 페이지번호, 타입(JSON)
            http://openapi.airkorea.or.kr/openapi/services/rest/ArpltnInforInqireSvc/getCtprvnMesureSidoLIst?serviceKey=&numOfRows=40&pageSize=40&sidoName=%EC%84%9C%EC%9A%B8&searchCondition=HOUR&_returnType=json
             */

            option = {
                uri: `http://openapi.airkorea.or.kr/openapi/services/rest/ArpltnInforInqireSvc/getCtprvnMesureSidoLIst?serviceKey=${apiKeyGonggong_MISAE}&numOfRows=40&sidoName=%EC%84%9C%EC%9A%B8&searchCondition=HOUR&_returnType=json`,
                method: "GET"
            };

            request(option, (err, resp, body) => {

                //현재 미세먼지 데이터 !!!
                let misaeData = JSON.parse(body).list;

                // START !!!!!!!

                //우리가 사용할 온도, 습도, 하늘상태, 강수형태 정보만 추출
                //T1H:온도, SKY:하늘상태(1: 맑음, 2: 구름조금, 3: 구름많음, 4: 흐림), REH:습도, PTY: 강수형태(0: 없음, 1: 비, 2: 비/눈, 3: 눈)
                let silhwangFiltered = {};

                for (let value of silhwangData.response.body.items.item) {

                    if (value.category === "T1H" || value.category === "SKY" || value.category === "REH" || value.category === "PTY") {

                        silhwangFiltered[value.category] = value.obsrValue;

                    }
                }

                console.log(silhwangFiltered);

                let misaeFiltered = {};

                for (let value of misaeData) {

                    if(value.cityName === local) {
                        misaeFiltered['pm10Value'] = parseInt(value.pm10Value);
                        misaeFiltered['pm25Value'] = parseInt(value.pm25Value);
                    }
                }

                if (!misaeFiltered.pm10Value) {

                    let average10Value = 0;
                    let average25Value = 0;

                    for (let value of misaeData) {
                        average10Value += value['pm10Value'] / 25;
                        average25Value += value['pm25Value'] / 25;
                    }

                    misaeFiltered['pm10Value'] = Math.round(average10Value);
                    misaeFiltered['pm25Value'] = Math.round(average25Value);

                }

                console.log(misaeFiltered);

                temper = silhwangFiltered['T1H'];
                humidity = silhwangFiltered['REH'];
                land_weather = {'SKY': silhwangFiltered['SKY'], 'PTY':silhwangFiltered['PTY']};
                fine_dust = {'pm10': misaeFiltered.pm10Value, 'pm25': misaeFiltered.pm25Value};

                let data = {
                    "temperature": temper,
                    "humidity": humidity,
                    "land_weather": land_weather,
                    "fine_dust": fine_dust
                };

                res.r(data);
            })
        });
    }

    catch (err) {
        next(err);
    }
});

module.exports = router;
