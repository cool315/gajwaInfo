const express = require("express");
const http = require("http");
const app = express();
const path = require("path");
const { listenerCount } = require("process");
const server = http.createServer(app);
const socketIO = require("socket.io");

const io = socketIO(server);

const Timetable = require('comcigan-parser');
const timetable = new Timetable();

const NeisAPIKey = "5f5612a48ef14ad5ad8bc2747eddc965"

const schoolFinder = (schoolName, region) => (schoolList) => {
  const targetSchool = schoolList.find((school) => {
    return school.region === region && school.name.includes(schoolName);
  });
  return targetSchool;
};

app.use(express.static(path.join(__dirname, "src")));
const PORT = process.env.PORT || 7000;

io.on("connection", (socket)=> {
    socket.on("timetable", ()=>{
        timetable
            .init() // 캐시 1시간동안 보관
            .then(() => timetable.search('가좌'))
            .then(schoolFinder('가좌고등학교', '경기'))
            .then((school) => timetable.setSchool(school.code))
            .then(() => {
                Promise.all([timetable.getClassTime(), timetable.getTimetable()]).then((res) => {
                    param = {
                        "timeInfo": res[0], // 시간표
                        "timeTable": res[1][3][11] // 수업시간정보
                    }

                    socket.emit("timetable", param);
                });
            });
    })
    socket.on("food", (data)=>{
        let Tdate = `${data.year}${data.month}${data.day}`
        fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${NeisAPIKey}&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530854&MLSV_YMD=${Tdate}`)
            .then(res => res.json())
            .then((data) => {
                param = data;
                socket.emit("food", param);
            })
            .catch(err => console.error(err));
                })
    socket.on("calendar", (data)=>{
        let year = data["year"];
        let month = data["month"];
        let lastday;

        switch (month) {
            case "01": case "03": case "05": case "07": case "08": case "10": case "12":
                lastday = 31;
                break;
            case 1: case 3: case 5: case 7: case 8: case 10: case 12:
                lastday = 31;
                break;
            case "04": case "06": case "09": case "11":
                lastday = 30;
                break;
            case 4: case 6: case 9: case 11:
                lastday = 30;
                break;
            case "02":
            // 윤년 체크
                lastday = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28;
                break;
            case 2:
                lastday = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28;
                break;
            default:
                console.log("잘못된 달 입력");
                break;
        }

        let Fmonth = `${year}${month}01`
        let Lmonth = `${year}${month}${lastday}`

        fetch(`https://open.neis.go.kr/hub/SchoolSchedule?KEY=${NeisAPIKey}&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530854&AA_FROM_YMD=${Fmonth}&AA_TO_YMD=${Lmonth}`)
            .then(res => res.json())
            .then((data) => {
                param = data;
                socket.emit("calendar", param);
            })
            .catch(err => console.error(err));
                })
})

server.listen(PORT, ()=>console.log(`server is running ${PORT}`))