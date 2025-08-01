// Map functionality for Air Quality Monitoring
class AirQualityMap {
  constructor() {
    this.map = null;
    this.sensors = [];
    this.markers = [];
    this.init();
  }

  init() {
    this.initMap();
    this.loadSensors();
    this.startAutoRefresh();
  }

  initMap() {
    // Initialize map centered on Hanoi
    this.map = L.map("map").setView([21.0285, 105.8542], 11);

    // Add tile layer with custom styling
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(this.map);

    // Add custom controls
    this.addCustomControls();
  }

  addCustomControls() {
    // Refresh button
    const refreshControl = L.control({ position: "topleft" });
    refreshControl.onAdd = () => {
      const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      div.innerHTML =
        '<a href="#" title="Làm mới dữ liệu"><i class="fas fa-sync-alt"></i></a>';
      div.style.backgroundColor = "white";
      div.style.padding = "5px";
      div.style.borderRadius = "4px";

      L.DomEvent.on(div, "click", (e) => {
        L.DomEvent.preventDefault(e);
        this.refreshData();
        playSound("click");
      });

      return div;
    };
    refreshControl.addTo(this.map);

    // Legend control
    const legendControl = L.control({ position: "bottomright" });
    legendControl.onAdd = () => {
      const div = L.DomUtil.create("div", "legend-control");
      div.innerHTML = `
                <div style="background: white; padding: 10px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                    <h4 style="margin: 0 0 10px 0;">Chất lượng không khí</h4>
                    <div><span style="color: #10b981;">●</span> Tốt (0-50)</div>
                    <div><span style="color: #f59e0b;">●</span> Trung bình (51-100)</div>
                    <div><span style="color: #ef4444;">●</span> Kém (>100)</div>
                </div>
            `;
      return div;
    };
    legendControl.addTo(this.map);
  }

  async loadSensors() {
    try {
      showLoading();
      const response = await fetch("/api/sensors");
      this.sensors = await response.json();
      this.updateMarkers();
      playSound("notification");
    } catch (error) {
      console.error("Error loading sensors:", error);
    } finally {
      hideLoading();
    }
  }

  updateMarkers() {
    // Clear existing markers
    this.markers.forEach((marker) => this.map.removeLayer(marker));
    this.markers = [];

    // Add new markers
    this.sensors.forEach((sensor) => {
      const marker = this.createSensorMarker(sensor);
      this.markers.push(marker);
      marker.addTo(this.map);
    });
  }

  createSensorMarker(sensor) {
    const latest = sensor.latest_measurement;
    let color = "#6b7280"; // Default gray
    let quality = "Không có dữ liệu";

    if (latest && latest.pm25 !== null) {
      const pm25 = latest.pm25;
      if (pm25 <= 50) {
        color = "#10b981";
        quality = "Tốt";
      } else if (pm25 <= 100) {
        color = "#f59e0b";
        quality = "Trung bình";
      } else {
        color = "#ef4444";
        quality = "Kém";
      }
    }

    // Create custom icon
    const icon = L.divIcon({
      className: "custom-marker",
      html: `
                <div style="
                    background: ${color};
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: pulse 2s infinite;
                ">
                    <i class="fas fa-wind" style="color: white; font-size: 12px;"></i>
                </div>
            `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    const marker = L.marker([sensor.latitude, sensor.longitude], { icon });

    // Create popup content
    const popupContent = this.createPopupContent(sensor, latest, quality);
    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: "custom-popup",
    });

    // Add click sound
    marker.on("click", () => playSound("click"));

    return marker;
  }

  createPopupContent(sensor, latest, quality) {
    const formatValue = (value, unit) => {
      return value !== null && value !== undefined
        ? `${value.toFixed(1)} ${unit}`
        : "N/A";
    };

    const timestamp = latest
      ? new Date(latest.timestamp).toLocaleString("vi-VN")
      : "N/A";

    return `
            <div class="popup-content">
                <div class="popup-header">
                    <i class="fas fa-map-marker-alt"></i> ${sensor.name}
                </div>
                <div class="popup-description">
                    ${sensor.location_description}
                </div>
                <div class="quality-status">
                    <span class="quality-indicator quality-${quality.toLowerCase()}">
                        ${quality}
                    </span>
                </div>
                ${
                  latest
                    ? `
                    <div class="measurements-grid">
                        <div class="measurement-item">
                            <span class="label">PM2.5:</span>
                            <span class="value">${formatValue(
                              latest.pm25,
                              "µg/m³"
                            )}</span>
                        </div>
                        <div class="measurement-item">
                            <span class="label">PM10:</span>
                            <span class="value">${formatValue(
                              latest.pm10,
                              "µg/m³"
                            )}</span>
                        </div>
                        <div class="measurement-item">
                            <span class="label">CO:</span>
                            <span class="value">${formatValue(
                              latest.co,
                              "ppm"
                            )}</span>
                        </div>
                        <div class="measurement-item">
                            <span class="label">NO₂:</span>
                            <span class="value">${formatValue(
                              latest.no2,
                              "ppb"
                            )}</span>
                        </div>
                        <div class="measurement-item">
                            <span class="label">Nhiệt độ:</span>
                            <span class="value">${formatValue(
                              latest.temperature,
                              "°C"
                            )}</span>
                        </div>
                        <div class="measurement-item">
                            <span class="label">Độ ẩm:</span>
                            <span class="value">${formatValue(
                              latest.humidity,
                              "%"
                            )}</span>
                        </div>
                    </div>
                    <div class="popup-timestamp">
                        <i class="fas fa-clock"></i> Cập nhật: ${timestamp}
                    </div>
                `
                    : '<div class="no-data">Không có dữ liệu đo</div>'
                }
                <style>
                    .popup-content { font-family: 'Segoe UI', sans-serif; }
                    .popup-header { font-size: 16px; font-weight: bold; color: #2563eb; margin-bottom: 8px; }
                    .popup-description { color: #6b7280; margin-bottom: 10px; font-size: 14px; }
                    .quality-status { text-align: center; margin: 10px 0; }
                    .quality-indicator { 
                        padding: 4px 12px; 
                        border-radius: 12px; 
                        font-size: 12px; 
                        font-weight: bold; 
                        text-transform: uppercase; 
                    }
                    .quality-tốt { background: #10b981; color: white; }
                    .quality-trung { background: #f59e0b; color: white; }
                    .quality-kém { background: #ef4444; color: white; }
                    .measurements-grid { 
                        display: grid; 
                        grid-template-columns: 1fr 1fr; 
                        gap: 8px; 
                        margin: 12px 0; 
                    }
                    .measurement-item { 
                        display: flex; 
                        justify-content: space-between; 
                        padding: 4px 0; 
                        border-bottom: 1px solid #e5e7eb; 
                    }
                    .label { color: #6b7280; font-size: 13px; }
                    .value { font-weight: bold; color: #374151; font-size: 13px; }
                    .popup-timestamp { 
                        text-align: center; 
                        color: #9ca3af; 
                        font-size: 12px; 
                        margin-top: 10px; 
                        padding-top: 8px; 
                        border-top: 1px solid #e5e7eb; 
                    }
                    .no-data { text-align: center; color: #9ca3af; font-style: italic; }
                </style>
            </div>
        `;
  }

  async refreshData() {
    await this.loadSensors();
  }

  startAutoRefresh() {
    // Refresh data every 5 minutes
    setInterval(() => {
      this.refreshData();
    }, 5 * 60 * 1000);
  }
}

// Initialize map when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("map")) {
    window.airQualityMap = new AirQualityMap();
  }
});
