"use strict"

const socket = io();

const contentDisplay = document.querySelector("#content");
const titleDisplay = document.querySelector("#title")

function loadmain() {
    titleDisplay.innerText = "가좌고 알리미"
    contentDisplay.innerText = "학교 홈페이지는 쓸모없고 급식, 시간표, 일정 다 따로따로 찾아보느라 열받아서 내가 만들었다";
} function loadtimetable() {
    titleDisplay.innerText = "3학년 11반 시간표"
    contentDisplay.innerHTML = "";
    socket.emit("timetable");
} function loadfood() {
    titleDisplay.innerText = "오늘의 급식"
    contentDisplay.innerText = "업데이트 준비중";
    //socket.emit("timetable");
} function loadcalendar() {
    titleDisplay.innerText = "학사 일정"
    contentDisplay.innerText = "업데이트 준비중";
    //socket.emit("timetable");
}

socket.on("timetable", (data) => {
    renderTimetable(data["timeTable"])
})

function renderTimetable(data) {
  const weekdays = ["월", "화", "수", "목", "금"];
  const maxClasses = 8;

  // 테이블 헤더
  let html = "<table><thead><tr><th>교시</th>";
  weekdays.forEach(day => html += `<th>${day}</th>`);
  html += "</tr></thead><tbody>";

  // 각 교시 행
  for (let time = 1; time <= maxClasses; time++) {
    html += `<tr><td>${time}교시</td>`;
    for (let day = 0; day < weekdays.length; day++) {
      const subject = data[day]?.find(c => c.classTime === time)?.subject || "";
      const teacher = data[day]?.find(c => c.classTime === time)?.teacher || "";
      html += `<td>${subject ? subject + "<br><small>" + teacher + "</small>" : ""}</td>`;
    }
    html += "</tr>";
  }

  html += "</tbody></table>";
  document.getElementById("content").innerHTML = html;
}