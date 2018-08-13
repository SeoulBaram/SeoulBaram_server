import pandas as pd
import requests
from config.secretKey import apiKeySeoul


class Culture(object):

    # 생성자
    def __init__(self):
        self.total_count = requests.get(url="http://openAPI.seoul.go.kr:8088/" + apiKeySeoul + "/json/SearchConcertDetailService/1/1/").json()['SearchConcertDetailService']['list_total_count']
        self.url = "http://openAPI.seoul.go.kr:8088/"+apiKeySeoul+"/json/SearchConcertDetailService/"


    #서울 데이터 포털에서 100개씩 데이터 가져와서 판다스에 넣기
    def get_culture(self):
        """

        :return: Pandas Object
        """

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
                    if item['SUBJCODE'] and item['PLACE'] and item['MAIN_IMG'] and item['TITLE'] and item['STRTDATE'] and item['END_DATE'] and item['GCODE'] and (item['GCODE'][-1] == '구'):

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

            total_count = total_count - 100
            index = index + 100

        #나머지 잔류 데이터 판다스에 추가하기
        print(requests.get(self.url + str(index) + "/" + str(index + total_count - 1) + "/").json())
        try:
            data = requests.get(self.url + str(index) + "/" + str(index + total_count - 1) + "/").json()
            data = data['SearchConcertDetailService']['row']

            #판다스에 추가하기

            for item in data:
                #타이틀, 이미지, 장소, 장르코드, 시작일, 마감일은 NOT NULL
                #GCODE는 시간 되면 장소 => 구 대응
                if item['SUBJCODE'] and item['PLACE'] and item['MAIN_IMG'] and item['TITLE'] and item['STRTDATE'] and item['END_DATE'] and item['GCODE'] and (item['GCODE'][-1] == '구'):

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

        #test
        df.to_csv('./pandas.csv', encoding='ms949')

        #Dataframe 반환
        return df


    #문화데이터에 필요 요소 추가 및 가공하기
    def reformat_culture(self, df):
        """

        :param df: Pandas Object
        :return: Pandas Object

        1) NULL DATA Handling
        2) Order by SUBJCODE AESC
        3) ADD ISINSIDE Column
            - 0: OUTSIDE, 1: INSIDE, 99: UNKNOWN
            - Algorithm
                * 1) Default Value: 99
                * 2) CODE 3, 6, 19: 1
                * 3) CODE 12: 0
                * 4) Keyword Mapping if Prop > 90%
        """

        #1) NULL DATA Handling
        df = df.replace("", 'NULL')

        #2) Order by SUBJCODE AESC
        df = df.sort_values(by='SUBJCODE', ascending=True)

        #3-1) ADD ISINSIDE Column With Default Value
        df['ISINSIDE'] = 99

        #3-2) SUBJCODE 3, 6, 19 ==> 1
        df.loc[df['SUBJCODE'] == 3, 'ISINSIDE'] = 1
        df.loc[df['SUBJCODE'] == 6, 'ISINSIDE'] = 1
        df.loc[df['SUBJCODE'] == 19, 'ISINSIDE'] = 1

        #3-3) SUBJCODE 12 ==> 0
        df.loc[df['SUBJCODE'] == 12, 'ISINSIDE'] = 0

        #3-4) Keyword Mapping if Prop > 90%

        #Inner Function
        def get_or_value(list_1, list_2):
            list_result = []

            for i in range(0, len(list_1)):
                list_result.append(list_1[i] or list_2[i])

            return list_result

        #INSIDE KEYWORD LIST & OUTSIDE KEYWORD LIST
        keyword_inside = ['CKL스테이지', '강당', '강의실', '갤러리', '극장', '도서관', '디자인둘레길', '뜰안', '문화의집', '미술관', '북카페', '상가', '센터', '소극장', '수련관', '스쿨', '시청각실', '씨어터', '아트센터', '연습실', '열람실', '예술의전당', '음악당', '전시관', '전시실', '주민센터', '체육관', '체육회관', '층', '학습관', '홀']
        keyword_outside = ['거리', '공원', '광장', '교통섬', '구장', '마당', '분수', '산', '숲', '앞', '야외', '역사', '옆', '운동장', '정원', '텃밭']
        keyword_inside_weight = ['강의실', '도서관', '센터', '수련관', '층', '홀']

        #INSIDE filter & OUTSIDE filter
        filter_inside = [False] * len(list(df.PLACE))
        filter_outside = [False] * len(list(df.PLACE))
        filter_inside_weight = [False] * len(list(df.PLACE))

        for keyword in keyword_inside:
            filter_inside = get_or_value(filter_inside, [keyword in v for v in list(df.PLACE)])

        for keyword in keyword_outside:
            filter_outside = get_or_value(filter_outside, [keyword in v for v in list(df.PLACE)])

        for keyword in keyword_inside_weight:
            filter_inside_weight = get_or_value(filter_inside_weight, [keyword in v for v in list(df.PLACE)])

        #Add INSIDE & OUTSIDE filter
        df.loc[filter_inside, 'ISINSIDE'] = 1
        df.loc[filter_outside, 'ISINSIDE'] = 0
        df.loc[filter_inside_weight, 'ISINSIDE'] = 1

        df.to_csv("./filtered.csv", encoding="ms949")

        return df

    # 판다스 RDS에 넣기, 만약 힘들면 csv 포맷으로 저장!
    def store_culture(self, df):
        """

        :param df: Pandas Object
        :return: NULL
        """
        df.to_csv("./culture.csv", encoding="ms949")


if __name__ == "__main__":

    #문화 클래스 인스턴스화
    culture = Culture()

    #문화 데이터 가져와서 판다스에 넣기
    df = culture.get_culture()

    #판다스 객체에서 적절하게 Reformatting
    df = culture.reformat_culture(df=df)

    #데이터 저장하기
    culture.store_culture(df)