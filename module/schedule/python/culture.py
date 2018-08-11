import pandas as pd
import requests
from config.secretKey import apiKeySeoul
a = ""

class Culture(object):

    # 생성자
    def __init__(self):
        self.total_count = requests.get(url="http://openAPI.seoul.go.kr:8088/" + apiKeySeoul + "/json/SearchConcertDetailService/1/1/").json()['SearchConcertDetailService']['list_total_count']
        self.url = "http://openAPI.seoul.go.kr:8088/"+apiKeySeoul+"/json/SearchConcertDetailService/"


    # 서울 데이터 포털에서 100개씩 데이터 가져와서 판다스에 넣기
    def get_culture(self):

        #DATAFRAME - SUBJCODE, CODENAME, TITLE, STRTDATE, END_DATE, TIME, PLACE, ORG_LINK, MAIN_IMG, USE_TRGT, GCODE
        columns = ['SUBJCODE', 'CODENAME', 'TITLE', 'STRTDATE', 'END_DATE', 'TIME', 'PLACE', 'ORG_LINK', 'MAIN_IMG', 'USE_TRGT', 'GCODE']
        df = pd.DataFrame(columns=columns)

        total_count = self.total_count
        index = 1

        # 100 개씩 끊어서 가져오기
        while total_count >= 100:

            try:
                #data
                data = requests.get(self.url + str(index) + "/" + str(index + 99) + "/").json()

                #pandas에 데이터 넣기
                #### 넣을 데이터 목록: SUBJCODE, CODENAME, TITLE, STRTDATE, END_DATE, TIME, PLACE, ORG_LINK, MAIN_IMG, USE_TRGT, GCODE

                #json 배열
                data = data['SearchConcertDetailService']['row']

                #판다스에 추가하기

                for item in data:

                    # 타이틀, 이미지, 장소, 장르코드, 시작일, 마감일은 NOT NULL
                    # GCODE는 시간 되면 장소 => 구 대응
                    if item['SUBJCODE'] and item['PLACE'] and item['MAIN_IMG'] and item['TITLE'] and item['STRTDATE'] and item['END_DATE'] and item['GCODE']:

                        df = df.append({
                            'SUBJCODE': item['SUBJCODE'],
                            'CODENAME': item['CODENAME'],
                            'TITLE': item['TITLE'],
                            'STRTDATE': item['STRTDATE'],
                            'END_DATE': item['END_DATE'],
                            'TIME': item['TIME'],
                            'PLACE': item['PLACE'],
                            'ORG_LINK': item['ORG_LINK'],
                            'MAIN_IMG': item['MAIN_IMG'],
                            'USE_TRGT': item['USE_TRGT'],
                            'GCODE': item['GCODE']}, ignore_index=True)

            except:
                print("error")
                pass

            total_count = total_count - 100
            index = index + 100

        #나머지 잔류 데이터 판다스에 추가하기
        print(requests.get(self.url + str(index) + "/" + str(index + total_count - 1) + "/").json())
        print(self.url + str(index) + "/" + str(index + total_count - 1) + "/")

        df.to_csv('./aa.csv', encoding='ms949')
        return df

    # 판다스 RDS에 넣기, 만약 힘들면 csv 포맷으로 저장!
    def store_culture(self):
        pass


if __name__ == "__main__":
    culture = Culture()
    culture.get_culture()