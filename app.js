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

                    io.emit("timetable", param);
                });
            });
    })
})

server.listen(PORT, ()=>console.log(`server is running ${PORT}`))