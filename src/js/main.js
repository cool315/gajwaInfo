"use strict"

const socket = io();

const contentDisplay = document.querySelector("#content");
const titleDisplay = document.querySelector("#title")

let time = loadTime()
let year = time.year
let month = time.month
let day = time.day

function loadmain() {
    titleDisplay.innerText = "가좌고 알리미"
    contentDisplay.innerText = "학교 홈페이지는 쓸모없고 급식, 시간표, 일정 다 따로따로 찾아보느라 열받아서 내가 만들었다";
} function loadtimetable() {
    titleDisplay.innerText = "3학년 11반 시간표"
    contentDisplay.innerHTML = "";
    socket.emit("timetable");
} function loadfood() {
    titleDisplay.innerText = "오늘의 급식"
    socket.emit("food", {
      "year": year,
      "month": month,
      "day": day
    });
} function loadcalendar() {
    titleDisplay.innerText = "학사 일정"
    socket.emit("calendar", {
      "year": year,
      "month": month
    });
}

socket.on("timetable", (data) => {
    renderTimetable(data["timeTable"])
})
socket.on("food", (data) => {
    const menuHtml = data.mealServiceDietInfo[1].row[0].DDISH_NM;

    contentDisplay.innerHTML = menuHtml;
})
socket.on("calendar", (data) => {
  renderCalendarPage(data)
})

function loadTime() {
    const now = new Date();

    // 연, 월, 일
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // 0~11이므로 +1
    const day = String(now.getDate()).padStart(2, "0");

    // 시, 분, 초
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return({
      "year": year,
      "month": month,
      "day": day,
    })
}

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

function decreaseMonth() {
  month--;
  if (month <= 0) {
    month = 12;
    year--;
  } else if (month >= 13) {
    month = 1;
    year++;
  }

  const monthDisplay = document.querySelector("#monthlabel");
  if (monthDisplay) {
    monthDisplay.innerText = `${year} / ${month}`;
  }

  socket.emit("calendar", {
    year: year,
    month: month,
  });
} function increaseMonth() {
  month++;
  if (month <= 0) {
    month = 12;
    year--;
  } else if (month >= 13) {
    month = 1;
    year++;
  }

  const monthDisplay = document.querySelector("#monthlabel");
  if (monthDisplay) {
    monthDisplay.innerText = `${year} / ${month}`;
  }

  socket.emit("calendar", {
    year: year,
    month: month,
  });
}

function renderCalendarPage(data) {
  contentDisplay.innerHTML = ""; // 리셋

  const MonthDisplay = document.createElement("div");
  MonthDisplay.id = "monthlabel";
  MonthDisplay.innerText = `${year} / ${month}`;

  const DecreaseBtn = document.createElement("button");
  DecreaseBtn.id = "DecraseMonthBtn";
  DecreaseBtn.innerText = "이전 달";
  DecreaseBtn.onclick = decreaseMonth;

  const IncreaseBtn = document.createElement("button");
  IncreaseBtn.id = "IncreaseMonthBtn";
  IncreaseBtn.innerText = "이전 달";
  IncreaseBtn.onclick = increaseMonth;

  const calendar = document.createElement("div");
  calendar.className = "calendar";
  calendar.id = "calendar";

  // content div 안에 삽입
  contentDisplay.appendChild(MonthDisplay);
  contentDisplay.appendChild(DecreaseBtn);
  contentDisplay.appendChild(IncreaseBtn);
  contentDisplay.appendChild(calendar);

  const rows = data.SchoolSchedule[1]?.row || [];

  let firstDay = new Date(year, month - 1, 1).getDay();
  let lastDate = new Date(year, month, 0).getDate();

  // 요일 헤더
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  days.forEach((d) => {
    const header = document.createElement("div");
    header.textContent = d;
    header.className = "day-header";
    calendar.appendChild(header);
  });

  // 빈칸 채우기 (첫 주 시작 요일 맞추기)
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "day";
    calendar.appendChild(empty);
  }

  // 날짜 채우기 부분 수정
  for (let d = 1; d <= lastDate; d++) {
    const cell = document.createElement("div");
    cell.className = "day";
    cell.innerHTML = `<strong>${d}</strong>`;

    // 오늘 날짜 강조
    if (
      year === new Date().getFullYear() &&
      month === new Date().getMonth() + 1 &&
      d === new Date().getDate()
    ) {
      cell.classList.add("today"); // CSS로 스타일링
    }

    // 일정 확인
    const dateStr = `${year}${String(month).padStart(2, "0")}${String(d).padStart(2, "0")}`;
    const events = rows.filter((e) => e.AA_YMD === dateStr);

    events.forEach((ev) => {
      const div = document.createElement("div");
      div.className = "event";
      div.textContent = ev.EVENT_NM;
      cell.appendChild(div);
    });

    calendar.appendChild(cell);
  }
}