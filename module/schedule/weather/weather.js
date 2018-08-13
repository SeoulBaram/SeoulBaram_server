/*
==================================================================
[날씨, 대기정보와 관련된 API를 이용하여 독자적인 데이터베이스 구축]

******************************************************************
사용할 API 목록

    *공공데이터포털
    1) 중기예보정보조회서비스
       https://www.data.go.kr/dataset/15000495/openapi.do
******************************************************************
==================================================================
 */

const request = require('request');
const xml2js = require('xml2js');
const moment = require('moment');

const apiKeyGonggong = require('../../../config/secretKey').apiKeyGonggong;
const db = require('../../db');

//xml parser
let parser = new xml2js.Parser();

//Current Date
// let today = moment();
// let tommorow = today.add(30, "days");

//tmFc
let tmFc = moment().format("YYYYMMDD") + "0600";

//Temp - for developing
tmFc = "201808130600";

//미래 하늘 상태 데이터 얻기
let option = {
    uri:"http://newsky2.kma.go.kr/service/MiddleFrcstInfoService/getMiddleLandWeather?ServiceKey="+apiKeyGonggong+"&regId=11B00000&tmFc="+tmFc+"&numOfRows=1&pageNo=1",
    method: "GET"
};

request(option, (err, res, body) => {

    //xml to json
    parser.parseString(body, (err, result) => {

        //하늘 상태 데이터
        let landWeatherData = result;
        console.log(JSON.stringify(landWeatherData));

        //미래 온도 데이터 얻기
        option = {
            uri:"http://newsky2.kma.go.kr/service/MiddleFrcstInfoService/getMiddleTemperature?ServiceKey="+apiKeyGonggong+"&regId=11B10101&tmFc="+tmFc+"&pageNo=1&numOfRows=1",
            method: "GET"
        };

        request(option, (err, res, body) => {

            //xml to json
            parser.parseString(body, async (err, result) => {

                //온도 데이터
                let temperatureData = result;
                console.log(JSON.stringify(temperatureData));

                //***************** START!!! *****************//

                //데이터베이스에 넣기 좋은 형태로 변형하기
                let data = {};

                //적절한 우선순위에 따른 오전 오후 선택하기
                //우선순위에 따라 ampm 변수 바꾸는 거 추후 구현하세용!
                let ampm = "Am";

                //3일후 ~ 7일후 날짜 가져오기
                for (let i = 3; i < 8; i++) {
                    data["day" + i] = {
                        date: moment().add(i, "days").format("YYYY-MM-DD"),
                        land_weather: landWeatherData.response.body[0].items[0].item[0]["wf" + i + ampm][0],
                        max_temper: temperatureData.response.body[0].items[0].item[0]["taMax" + i][0],
                        min_temper: temperatureData.response.body[0].items[0].item[0]["taMin" + i][0]
                    }
                }

                console.log(data);

                //데이터베이스에 넣어주기

                //날짜 중복 확인 쿼리
                let checkQuery =
                    `
                    SELECT middle_forecast_idx FROM middle_forecast WHERE date = ?
                    `;

                try {
                    
                    //3일후 ~ 7일후
                    for (let i = 3; i < 8; i++) {
                        
                        // i 일후 데이터
                        let params = data["day" + i];
                        
                        let checkResult = await db.queryParamArr(checkQuery, [params.date]);

                        //이미 데이터베이스에 해당 날짜의 데이터가 있을 때 - 최신정보로 업데이트!
                        if (checkResult.length >= 1) {
                            
                            //업데이트 쿼리
                            let updateQuery =
                                `
                                UPDATE middle_forecast SET land_weather = ?, max_temper = ?, min_temper = ? WHERE date = ?
                                `;

                            await db.queryParamArr(updateQuery, [params.land_weather, params.max_temper, params.min_temper, params.date])
                        }

                        //새로운 데이터 일 때 - 새롭게 넣어주기!
                        else {
                            
                            //입력 쿼리
                            let insertQuery =
                                `
                                INSERT INTO middle_forecast (date, land_weather, max_temper, min_temper)
                                VALUES (?, ?, ?, ?)
                                `;

                            await db.queryParamArr(insertQuery, [params.date, params.land_weather, params.max_temper, params.min_temper]);
                        }
                    }
                } catch (error) {
                    console.log(error);
                    next("500");
                }

                console.log("callback end");
                
                //프로세스 종료
                process.exit();
            })
        })
    });
});