// static/js/charts.js

/**
 * Quản lý tất cả chức năng liên quan đến biểu đồ cho Hệ thống Giám sát Chất lượng Không khí.
 * Bao gồm tải dữ liệu, tạo, cập nhật, tự động làm mới, xuất dữ liệu và tooltip.
 */
class AirQualityCharts {
  /**
   * Khởi tạo class, thiết lập các thuộc tính ban đầu.
   */
  constructor() {
    this.sensors = [];
    this.charts = {}; // Lưu trữ các đối tượng Chart.js
    this.selectedSensor = null;
    this.timeRange = 24; // Mặc định là 24 giờ
    this.refreshInterval = null;
    this.REFRESH_RATE_MS = 60000; // Tự động làm mới mỗi 60 giây

    // Giả định các hàm này tồn tại trong scope global (từ base.html)
    this.showLoading =
      typeof showLoading === "function"
        ? window.showLoading
        : () => console.log("Loading...");
    this.hideLoading =
      typeof hideLoading === "function"
        ? window.hideLoading
        : () => console.log("Loading complete.");
    this.playSound =
      typeof playSound === "function" ? window.playSound : () => {};
  }

  /**
   * Phương thức chính để bắt đầu chạy toàn bộ logic.
   */
  async init() {
    this.showLoading();
    this._setupTooltips(); // Thiết lập tooltip trước
    await this.loadSensors();
    this.setupEventListeners();

    if (this.sensors.length > 0) {
      await this.createAllCharts();
      this.startAutoRefresh();
    } else {
      console.warn("No sensors available to display charts.");
      // Có thể hiển thị một thông báo cho người dùng
      const chartGrid = document.querySelector(".charts-grid");
      if (chartGrid) {
        chartGrid.innerHTML =
          '<p style="text-align: center; grid-column: 1 / -1;">Không có dữ liệu cảm biến để hiển thị.</p>';
      }
    }
    this.hideLoading();
  }

  // --- LOGIC TẢI VÀ LẤY DỮ LIỆU ---

  async loadSensors() {
    try {
      const response = await fetch("/api/sensors");
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      this.sensors = await response.json();

      if (this.sensors.length > 0) {
        this.selectedSensor = this.sensors[0].id;
        this.populateSensorSelects();
      } else {
        console.warn("No sensors found.");
      }
    } catch (error) {
      console.error("Error loading sensors:", error);
    }
  }

  populateSensorSelects() {
    const selects = document.querySelectorAll(".sensor-select");
    selects.forEach((select) => {
      select.innerHTML = ""; // Xóa option 'Đang tải...'
      this.sensors.forEach((sensor) => {
        const option = document.createElement("option");
        option.value = sensor.id;
        option.textContent = sensor.name;
        select.appendChild(option);
      });
      if (this.selectedSensor) {
        select.value = this.selectedSensor;
      }
    });
  }

  async fetchSensorData(sensorId, hours) {
    if (!sensorId) return [];
    try {
      const response = await fetch(
        `/api/data?sensor_id=${sensorId}&hours=${hours}`
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching sensor data:", error);
      return [];
    }
  }

  async fetchAverageData(sensorId, hours) {
    if (!sensorId) return null;
    try {
      const response = await fetch(
        `/api/averages?sensor_id=${sensorId}&hours=${hours}`
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching average data:", error);
      return null;
    }
  }

  setupEventListeners() {
    document.querySelectorAll(".sensor-select").forEach((select) => {
      select.addEventListener("change", (e) => {
        this.selectedSensor = parseInt(e.target.value);
        this.playSound("click");
        document
          .querySelectorAll(".sensor-select")
          .forEach((s) => (s.value = e.target.value));
        this.updateAllCharts();
      });
    });

    document.querySelectorAll(".time-range-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.timeRange = parseInt(e.target.dataset.hours);
        this.playSound("click");
        document
          .querySelectorAll(".time-range-btn")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        this.updateAllCharts();
      });
    });
  }

  // --- LOGIC TẠO VÀ CẬP NHẬT BIỂU ĐỒ ---

  async createAllCharts() {
    const historicalData = await this.fetchSensorData(
      this.selectedSensor,
      this.timeRange
    );
    const averageData = await this.fetchAverageData(
      this.selectedSensor,
      this.timeRange
    );

    this.createLineChart(
      "pm25Chart",
      "PM2.5",
      historicalData,
      (d) => d.pm25,
      "#ef4444"
    );
    this.createTemperatureHumidityChart(historicalData);
    this.createMultiParameterChart(historicalData);
    this.createAverageComparisonChart(averageData);
  }

  async updateAllCharts() {
    this.showLoading();
    const historicalData = await this.fetchSensorData(
      this.selectedSensor,
      this.timeRange
    );
    const averageData = await this.fetchAverageData(
      this.selectedSensor,
      this.timeRange
    );

    const labels = historicalData.map((d) =>
      new Date(d.timestamp).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    this.updateLineChart(this.charts.pm25Chart, labels, [
      historicalData.map((d) => d.pm25),
    ]);
    this.updateLineChart(this.charts.tempHumidityChart, labels, [
      historicalData.map((d) => d.temperature),
      historicalData.map((d) => d.humidity),
    ]);
    this.updateLineChart(this.charts.multiParamChart, labels, [
      historicalData.map((d) => d.pm25),
      historicalData.map((d) => d.pm10),
      historicalData.map((d) => d.co),
      historicalData.map((d) => d.no2),
    ]);

    if (this.charts.averageComparisonChart && averageData) {
      this.charts.averageComparisonChart.data.datasets[0].data = Object.values(
        averageData.selected_sensor_avg
      );
      this.charts.averageComparisonChart.data.datasets[1].data = Object.values(
        averageData.all_sensors_avg
      );
      this.charts.averageComparisonChart.update("none");
    }

    this.hideLoading();
  }

  updateLineChart(chart, labels, datasetsData) {
    if (chart) {
      chart.data.labels = labels;
      datasetsData.forEach((data, index) => {
        if (chart.data.datasets[index]) {
          chart.data.datasets[index].data = data;
        }
      });
      chart.update("none");
    }
  }

  startAutoRefresh() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(() => {
      console.log("Auto-refreshing charts...");
      this.updateAllCharts();
    }, this.REFRESH_RATE_MS);
  }

  // --- CÁC HÀM TẠO BIỂU ĐỒ CỤ THỂ ---

  createLineChart(canvasId, label, data, dataSelector, color) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    this.charts[canvasId] = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((d) =>
          new Date(d.timestamp).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        ),
        datasets: [
          {
            label: label,
            data: data.map(dataSelector),
            borderColor: color,
            backgroundColor: `${color}33`, // Thêm alpha
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  createTemperatureHumidityChart(data) {
    const ctx = document.getElementById("tempHumidityChart");
    if (!ctx) return;

    this.charts.tempHumidityChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((d) =>
          new Date(d.timestamp).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        ),
        datasets: [
          {
            label: "Nhiệt độ (°C)",
            data: data.map((d) => d.temperature),
            borderColor: "#f97316",
            backgroundColor: "#f9731633",
            yAxisID: "y_temp",
            tension: 0.4,
            pointRadius: 0,
          },
          {
            label: "Độ ẩm (%)",
            data: data.map((d) => d.humidity),
            borderColor: "#3b82f6",
            backgroundColor: "#3b82f633",
            yAxisID: "y_humidity",
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", labels: { usePointStyle: true } },
        },
        scales: {
          y_temp: {
            type: "linear",
            position: "left",
            title: { display: true, text: "Nhiệt độ (°C)" },
          },
          y_humidity: {
            type: "linear",
            position: "right",
            title: { display: true, text: "Độ ẩm (%)" },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }

  createMultiParameterChart(data) {
    const ctx = document.getElementById("multiParamChart");
    if (!ctx) return;

    this.charts.multiParamChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((d) =>
          new Date(d.timestamp).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        ),
        datasets: [
          {
            label: "PM2.5",
            data: data.map((d) => d.pm25),
            borderColor: "#ef4444",
            yAxisID: "y_pm",
            tension: 0.4,
            pointRadius: 0,
          },
          {
            label: "PM10",
            data: data.map((d) => d.pm10),
            borderColor: "#f59e0b",
            yAxisID: "y_pm",
            tension: 0.4,
            pointRadius: 0,
          },
          {
            label: "CO",
            data: data.map((d) => d.co),
            borderColor: "#10b981",
            yAxisID: "y_gas",
            tension: 0.4,
            pointRadius: 0,
          },
          {
            label: "NO₂",
            data: data.map((d) => d.no2),
            borderColor: "#8b5cf6",
            yAxisID: "y_gas",
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", labels: { usePointStyle: true } },
        },
        scales: {
          y_pm: {
            type: "linear",
            position: "left",
            title: { display: true, text: "Nồng độ PM (µg/m³)" },
          },
          y_gas: {
            type: "linear",
            position: "right",
            title: { display: true, text: "Nồng độ Khí (ppm/ppb)" },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }

  createAverageComparisonChart(data) {
    const ctx = document.getElementById("averageComparisonChart");
    if (!ctx || !data) return;

    this.charts.averageComparisonChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(data.selected_sensor_avg).map((k) =>
          k.toUpperCase()
        ),
        datasets: [
          {
            label: "Cảm biến đang chọn",
            data: Object.values(data.selected_sensor_avg),
            backgroundColor: "#3b82f6",
            borderWidth: 1,
          },
          {
            label: "Trung bình toàn hệ thống",
            data: Object.values(data.all_sensors_avg),
            backgroundColor: "#6b7280",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top" }, title: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  // --- CHỨC NĂNG PHỤ (EXPORT & TOOLTIP) ---

  _setupTooltips() {
    let tooltipEl = null;
    document
      .querySelectorAll(".chart-info[data-tooltip]")
      .forEach((infoIcon) => {
        infoIcon.addEventListener("mouseenter", (e) => {
          const tooltipText = e.currentTarget.dataset.tooltip;
          tooltipEl = document.createElement("div");
          tooltipEl.className = "tooltip-popup";
          tooltipEl.textContent = tooltipText;
          document.body.appendChild(tooltipEl);
          const rect = e.currentTarget.getBoundingClientRect();
          tooltipEl.style.left = `${rect.left + rect.width / 2}px`;
          tooltipEl.style.top = `${rect.top - 10}px`;
          setTimeout(() => tooltipEl.classList.add("show"), 10);
        });
        infoIcon.addEventListener("mouseleave", () => {
          if (tooltipEl) {
            tooltipEl.remove();
            tooltipEl = null;
          }
        });
      });
  }

  async exportData(format) {
    if (!this.selectedSensor) {
      alert("Vui lòng chọn một cảm biến để xuất dữ liệu.");
      return;
    }
    this.showLoading();
    try {
      const data = await this.fetchSensorData(
        this.selectedSensor,
        this.timeRange
      );
      if (!data || data.length === 0) {
        alert("Không có dữ liệu để xuất.");
        return;
      }
      if (format === "csv") this._exportToCSV(data);
      else if (format === "json") this._exportToJSON(data);
      this.playSound("notification");
    } catch (error) {
      console.error("Lỗi khi xuất dữ liệu:", error);
      alert("Đã xảy ra lỗi trong quá trình xuất dữ liệu.");
    } finally {
      this.hideLoading();
    }
  }

  exportChartImage(canvasId, filename = "chart.png") {
    const chart = this.charts[canvasId];
    if (chart && chart.canvas) {
      const link = document.createElement("a");
      link.href = chart.canvas.toDataURL("image/png", 1.0); // 1.0 for high quality
      link.download = filename;
      link.click();
      this.playSound("notification");
    } else {
      alert(`Không tìm thấy biểu đồ với ID: ${canvasId}`);
    }
  }

  _exportToCSV(data) {
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ].join("\n");
    this._downloadFile(
      csvContent,
      "air_quality_data.csv",
      "text/csv;charset=utf-8;"
    );
  }

  _exportToJSON(data) {
    const jsonContent = JSON.stringify(data, null, 2);
    this._downloadFile(
      jsonContent,
      "air_quality_data.json",
      "application/json"
    );
  }

  _downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}

// --- Điểm khởi chạy ---
document.addEventListener("DOMContentLoaded", () => {
  // Gán đối tượng vào window để các hàm onclick trong HTML có thể gọi được
  window.airQualityCharts = new AirQualityCharts();
  window.airQualityCharts.init();
});
