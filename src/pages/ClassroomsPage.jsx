import { useEffect, useMemo, useState } from "react";

const classroomsData = [

{ name: "1004", department: "Lobby", floor: "2", building: "A11" },
{ name: "1010", department: "Lobby", floor: "2", building: "A11" },
{ name: "1011", department: "Lobby", floor: "2", building: "A11" },
{ name: "1014", department: "Lobby", floor: "2", building: "A11" },
{ name: "1020", department: "Lobby", floor: "2", building: "A11" },
{ name: "1021", department: "Lobby", floor: "2", building: "A11" },
{ name: "1028", department: "Lobby", floor: "2", building: "A11" },
{ name: "1032", department: "Lobby", floor: "2", building: "A11" },
{ name: "1034", department: "Lobby", floor: "2", building: "A11" },
{ name: "1037", department: "Lobby", floor: "2", building: "A11" },
{ name: "1046", department: "Lobby", floor: "2", building: "A11" },
{ name: "1049", department: "Lobby", floor: "2", building: "A11" },
{ name: "1056", department: "Lobby", floor: "2", building: "A11" },
{ name: "1140", department: "Lobby", floor: "2", building: "A11" },
{ name: "2004", department: "Lobby", floor: "3", building: "A11" },
{ name: "2006", department: "Lobby", floor: "3", building: "A11" },
{ name: "2008", department: "Lobby", floor: "3", building: "A11" },
{ name: "2011", department: "Lobby", floor: "3", building: "A11" },
{ name: "2020B", department: "Lobby", floor: "3", building: "A11" },
{ name: "2022", department: "Lobby", floor: "3", building: "A11" },
{ name: "2023", department: "Lobby", floor: "3", building: "A11" },
{ name: "2035", department: "Lobby", floor: "3", building: "A11" },
{ name: "2054", department: "Lobby", floor: "3", building: "A11" },
{ name: "2056", department: "Lobby", floor: "3", building: "A11" },
{ name: "G028", department: "Lobby", floor: "1", building: "A11" },
{ name: "G032", department: "Lobby", floor: "1", building: "A11" },
{ name: "G034", department: "Lobby", floor: "1", building: "A11" },

{ name: "1159", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1160", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1161", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1163", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1164", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1165", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1166", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1167", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1172", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1173", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1174", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1176", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1177", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1178", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1181", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1182", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1183", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1187", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1188", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1189", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1194", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1196", department: "Computer Science", floor: "2", building: "A11" },
{ name: "1197", department: "Computer Science", floor: "2", building: "A11" },
{ name: "F1169", department: "Computer Science", floor: "2", building: "A11" },
{ name: "F1179", department: "Computer Science", floor: "2", building: "A11" },
{ name: "F1190", department: "Computer Science", floor: "2", building: "A11" },
{ name: "F1191", department: "Computer Science", floor: "2", building: "A11" },
{ name: "F1192", department: "Computer Science", floor: "2", building: "A11" },
{ name: "F1193", department: "Computer Science", floor: "2", building: "A11" },
{ name: "F1199", department: "Computer Science", floor: "2", building: "A11" },

{ name: "1058", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1073", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1074", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1076", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1077", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1078", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1079", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1081", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1082", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1083", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1084", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1085", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1086", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1087", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1089", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1090", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1091", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1092", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1093", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1094", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1095", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "1186", department: "Computer Engineering", floor: "2", building: "A11" },
{ name: "F1060", department: "Computer Engineering", floor: "2", building: "A11" },

{ name: "1099", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1100", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1102", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1103", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1104", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1105", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1106", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1107", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1108", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1112", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1113", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1114", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1115", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1116", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1117", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1118", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1122", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1123", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1127", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1128", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1129", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1134", department: "Information Systems", floor: "2", building: "A11" },
{ name: "1137", department: "Information Systems", floor: "2", building: "A11" },
{ name: "F1110", department: "Information Systems", floor: "2", building: "A11" },
{ name: "F1119", department: "Information Systems", floor: "2", building: "A11" },
{ name: "F1120", department: "Information Systems", floor: "2", building: "A11" },
{ name: "F1130", department: "Information Systems", floor: "2", building: "A11" },
{ name: "F1131", department: "Information Systems", floor: "2", building: "A11" },
{ name: "F1132", department: "Information Systems", floor: "2", building: "A11" },
{ name: "F1133", department: "Information Systems", floor: "2", building: "A11" },
{ name: "F1139", department: "Information Systems", floor: "2", building: "A11" },

{ name: "1209", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1210", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1211", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1213", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1214", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1215", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1217", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1218", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1219", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1221", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1222", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1223", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1224", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1225", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1226", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1227", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1228", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1229", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1230", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1231", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1232", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1233", department: "Networks and Communications", floor: "2", building: "A11" },
{ name: "1250", department: "Networks and Communications", floor: "2", building: "A11" },

{ name: "G102", department: "Lab 1", floor: "1", building: "A11" },
{ name: "G112", department: "Lab 1", floor: "1", building: "A11" },
{ name: "G116", department: "Lab 1", floor: "1", building: "A11" },
{ name: "G119", department: "Lab 1", floor: "1", building: "A11" },
{ name: "G128", department: "Lab 1", floor: "1", building: "A11" },
{ name: "G130", department: "Lab 1", floor: "1", building: "A11" },
{ name: "G131.A", department: "Lab 1", floor: "1", building: "A11" },
{ name: "G131.B", department: "Lab 1", floor: "1", building: "A11" },
{ name: "G133", department: "Lab 1", floor: "1", building: "A11" },
{ name: "G139", department: "Lab 1", floor: "1", building: "A11" },

{ name: "G161", department: "Lab 3", floor: "1", building: "A11" },
{ name: "G172", department: "Lab 3", floor: "1", building: "A11" },
{ name: "G175", department: "Lab 3", floor: "1", building: "A11" },
{ name: "G175.A", department: "Lab 3", floor: "1", building: "A11" },
{ name: "G175.B", department: "Lab 3", floor: "1", building: "A11" },
{ name: "G176", department: "Lab 3", floor: "1", building: "A11" },
{ name: "G179", department: "Lab 3", floor: "1", building: "A11" },
{ name: "G188", department: "Lab 3", floor: "1", building: "A11" },
{ name: "G190", department: "Lab 3", floor: "1", building: "A11" },
{ name: "G191.A", department: "Lab 3", floor: "1", building: "A11" },
{ name: "G191.B", department: "Lab 3", floor: "1", building: "A11" },
{ name: "G193.A", department: "Lab 3", floor: "1", building: "A11" },
{ name: "G195", department: "Lab 3", floor: "1", building: "A11" },
{ name: "G196", department: "Lab 3", floor: "1", building: "A11" },
{ name: "G199", department: "Lab 3", floor: "1", building: "A11" },

{ name: "1152", department: "Lab 4", floor: "2", building: "A11" },
{ name: "1175", department: "Lab 4", floor: "2", building: "A11" },
{ name: "F1140", department: "Lab 4", floor: "2", building: "A11" },
{ name: "F1147", department: "Lab 4", floor: "2", building: "A11" },
{ name: "F1151", department: "Lab 4", floor: "2", building: "A11" },
{ name: "F1154", department: "Lab 4", floor: "2", building: "A11" },

{ name: "G060", department: "Student Affairs Unit", floor: "1", building: "A11" },
{ name: "G069", department: "Student Affairs Unit", floor: "1", building: "A11" },
];

const deptConfig = {
  "Lobby": { color: "#6366f1", bg: "#eef2ff", icon: "🏛" },
  "Computer Science": { color: "#2563eb", bg: "#eff6ff", icon: "💻" },
  "Computer Engineering": { color: "#0891b2", bg: "#ecfeff", icon: "⚙️" },
  "Information Systems": { color: "#7c3aed", bg: "#f5f3ff", icon: "🗄" },
  "Networks and Communications": { color: "#059669", bg: "#ecfdf5", icon: "🌐" },
  "Lab 1": { color: "#d97706", bg: "#fffbeb", icon: "🔬" },
  "Lab 3": { color: "#ea580c", bg: "#fff7ed", icon: "🧪" },
  "Lab 4": { color: "#dc2626", bg: "#fef2f2", icon: "🖥" },
  "Student Affairs Unit": { color: "#0f172a", bg: "#f8fafc", icon: "🎓" },
};

const floorLabels = {
  "1": "Floor 1 (Ground)",
  "2": "Floor 2",
  "3": "Floor 3",
};

function ClassroomsPage() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All Departments");
  const [floor, setFloor] = useState("All Floors");
  const [copiedRoom, setCopiedRoom] = useState(null);

  useEffect(() => {
    localStorage.setItem("classrooms", JSON.stringify(classroomsData));
  }, []);

  const departments = useMemo(() => [
    "All Departments",
    ...new Set(classroomsData.map((item) => item.department)),
  ], []);

  const filteredRooms = useMemo(() => {
    return classroomsData.filter((room) => {
      const matchSearch =
        room.name.toLowerCase().includes(search.toLowerCase()) ||
        room.department.toLowerCase().includes(search.toLowerCase());
      const matchDepartment =
        department === "All Departments" || room.department === department;
      const matchFloor = floor === "All Floors" || room.floor === floor;
      return matchSearch && matchDepartment && matchFloor;
    });
  }, [search, department, floor]);

  const handleShare = (room) => {
    const text = `Room ${room.name} — Building ${room.building} — ${floorLabels[room.floor]} — ${room.department}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedRoom(room.name);
      setTimeout(() => setCopiedRoom(null), 2000);
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setDepartment("All Departments");
    setFloor("All Floors");
  };

  const hasActiveFilters =
    search !== "" ||
    department !== "All Departments" ||
    floor !== "All Floors";

  return (
    <div style={pageStyle}>
      <style>{`
.room-card {
  background: white;
  border-radius: 16px;
  padding: 18px;
  border: 1.5px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(15,23,42,0.05);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  position: relative;
  overflow: hidden;
}
.room-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(15,23,42,0.12);
  border-color: #cbd5e1;
}
.share-btn {
  transition: background 0.15s ease, transform 0.1s ease;
}
.share-btn:hover {
  filter: brightness(1.08);
  transform: scale(1.03);
}
.share-btn:active {
  transform: scale(0.97);
}
.filter-select:focus, .search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
}
.dept-chip {
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}
.dept-chip:hover {
  opacity: 0.82;
  transform: scale(1.03);
}
.clear-btn:hover {
  background: #f1f5f9 !important;
}
      `}</style>

      <div style={container}>

        <div style={headerRow}>
          <div>
            <h1 style={title}>Classroom Finder</h1>
            <p style={subtitle}>Building A11 — {classroomsData.length} rooms across 3 floors</p>
          </div>
          <div style={totalBadge}>
            <span style={totalNum}>{filteredRooms.length}</span>
            <span style={totalLabel}>rooms found</span>
          </div>
        </div>

        <div style={creditBanner}>
          <span style={{ fontSize:"16px" }}>🙏</span>
          <div>
            <span style={{ fontWeight:"600", color:"#0f172a", fontSize:"13px" }}>
              Classroom data sourced from the CCSIT Student Council website.
            </span>
            <span style={{ color:"#64748b", fontSize:"13px" }}>
              {" "}Credit:{" "}
            </span>
            <a
              href="https://linkedin.com/in/mohammed-alajmi-b5a327206"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color:"#2563eb", fontWeight:"700", fontSize:"13px", textDecoration:"none" }}
            >
              Mohammed Ali Al-Ajmi
            </a>
            <span style={{ color:"#64748b", fontSize:"13px" }}>
              {" "}· Designer & Developer of the Student Council platform.
            </span>
          </div>
        </div>

        <div style={filterCard}>
          <div style={searchWrapper}>
            <span style={searchIcon}>🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder="Search by room number or department..."
              style={searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={clearXBtn}
              >
                ✕
              </button>
            )}
          </div>

          <div style={selectsRow}>
            <select
              className="filter-select"
              style={selectInput}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              {departments.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <select
              className="filter-select"
              style={selectInput}
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            >
              {["All Floors", ...Object.keys(floorLabels)].map((f) => (
                <option key={f} value={f}>
                  {f === "All Floors" ? "All Floors" : floorLabels[f]}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button className="clear-btn" onClick={handleClearFilters} style={clearFiltersBtn}>
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div style={chipsRow}>
          {departments.slice(1).map((dept) => {
            const cfg = deptConfig[dept] || { color: "#64748b", bg: "#f8fafc", icon: "🏠" };
            const isActive = department === dept;
            return (
              <div
                key={dept}
                className="dept-chip"
                onClick={() => setDepartment(isActive ? "All Departments" : dept)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 13px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: "600",
                  background: isActive ? cfg.color : cfg.bg,
                  color: isActive ? "white" : cfg.color,
                  border: `1.5px solid ${isActive ? cfg.color : "transparent"}`,
                  boxShadow: isActive ? `0 4px 12px ${cfg.color}33` : "none",
                }}
              >
                <span>{cfg.icon}</span>
                <span>{dept}</span>
              </div>
            );
          })}
        </div>

        {filteredRooms.length === 0 ? (
          <div style={emptyState}>
            <div style={emptyIcon}>🔎</div>
            <p style={emptyTitle}>No rooms found</p>
            <p style={emptyText}>Try adjusting your search or filters.</p>
            <button onClick={handleClearFilters} style={emptyBtn}>
              Clear all filters
            </button>
          </div>
        ) : (
          <div style={grid}>
            {filteredRooms.map((room, index) => {
              const cfg = deptConfig[room.department] || { color: "#64748b", bg: "#f8fafc", icon: "🏠" };
              const isCopied = copiedRoom === room.name;
              return (
                <div key={index} className="room-card">

                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: cfg.color, borderRadius: "16px 16px 0 0" }} />

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", marginTop: "4px" }}>
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "5px 10px",
                      borderRadius: "999px",
                      background: cfg.bg,
                      color: cfg.color,
                      fontWeight: "700",
                      fontSize: "12px",
                    }}>
                      <span>{cfg.icon}</span>
                      <span>{room.department}</span>
                    </div>
                    <span style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      fontFamily: "'DM Mono', monospace",
                      fontWeight: "500",
                    }}>
                      {floorLabels[room.floor]}
                    </span>
                  </div>

                  <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#0f172a",
                    letterSpacing: "-0.5px",
                    marginBottom: "10px",
                  }}>
                    {room.name}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "16px" }}>
                    <div style={metaRow}>
                      <span style={metaLabel}>Building</span>
                      <span style={{ ...metaValue, color: cfg.color, fontWeight: "700" }}>{room.building}</span>
                    </div>
                    <div style={metaRow}>
                      <span style={metaLabel}>Floor</span>
                      <span style={metaValue}>{floorLabels[room.floor]}</span>
                    </div>
                  </div>

                  <button
                    className="share-btn"
                    onClick={() => handleShare(room)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "10px",
                      border: "none",
                      background: isCopied ? "#22c55e" : cfg.color,
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "14px",
                      fontFamily: "'DM Sans', sans-serif",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    {isCopied ? (
                      <><span>✓</span><span>Copied!</span></>
                    ) : (
                      <><span>📋</span><span>Copy Room Info</span></>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyle = {
  padding: "24px 20px 40px",
  boxSizing: "border-box",
  fontFamily: "'DM Sans', sans-serif",
  minHeight: "100vh",
};

const container = {
  maxWidth: "1100px",
  margin: "0 auto",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "16px",
  marginBottom: "22px",
};

const title = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#0f172a",
  margin: "0 0 4px",
  letterSpacing: "-0.5px",
};

const subtitle = {
  color: "#64748b",
  fontSize: "15px",
  margin: 0,
};

const totalBadge = {
  background: "white",
  border: "1.5px solid #e2e8f0",
  borderRadius: "14px",
  padding: "12px 18px",
  textAlign: "center",
  boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
};

const totalNum = {
  display: "block",
  fontSize: "28px",
  fontWeight: "700",
  color: "#2563eb",
  fontFamily: "'DM Mono', monospace",
  lineHeight: 1,
};

const totalLabel = {
  display: "block",
  fontSize: "12px",
  color: "#94a3b8",
  fontWeight: "500",
  marginTop: "4px",
};

const filterCard = {
  background: "white",
  borderRadius: "16px",
  padding: "16px",
  border: "1.5px solid #e2e8f0",
  boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
  marginBottom: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const searchWrapper = {
  position: "relative",
  display: "flex",
  alignItems: "center",
};

const searchIcon = {
  position: "absolute",
  left: "14px",
  fontSize: "16px",
  pointerEvents: "none",
};

const searchInput = {
  width: "100%",
  padding: "12px 40px 12px 42px",
  borderRadius: "10px",
  border: "1.5px solid #e2e8f0",
  fontSize: "14px",
  background: "#f8fafc",
  color: "#0f172a",
  boxSizing: "border-box",
  fontFamily: "'DM Sans', sans-serif",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const clearXBtn = {
  position: "absolute",
  right: "12px",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#94a3b8",
  fontSize: "14px",
  padding: "4px",
  lineHeight: 1,
};

const selectsRow = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const selectInput = {
  flex: 1,
  minWidth: "160px",
  padding: "11px 14px",
  borderRadius: "10px",
  border: "1.5px solid #e2e8f0",
  fontSize: "14px",
  background: "#f8fafc",
  color: "#0f172a",
  fontFamily: "'DM Sans', sans-serif",
  cursor: "pointer",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const clearFiltersBtn = {
  padding: "11px 16px",
  borderRadius: "10px",
  border: "1.5px solid #e2e8f0",
  background: "white",
  color: "#475569",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  whiteSpace: "nowrap",
};

const chipsRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "20px",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
  gap: "16px",
};

const metaRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const metaLabel = {
  fontSize: "13px",
  color: "#94a3b8",
  fontWeight: "500",
};

const metaValue = {
  fontSize: "13px",
  color: "#334155",
  fontWeight: "600",
};

const emptyState = {
  textAlign: "center",
  padding: "60px 20px",
  background: "white",
  borderRadius: "20px",
  border: "1.5px solid #e2e8f0",
};

const emptyIcon = {
  fontSize: "48px",
  marginBottom: "16px",
};

const emptyTitle = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#0f172a",
  margin: "0 0 8px",
};

const emptyText = {
  color: "#64748b",
  margin: "0 0 20px",
};

const emptyBtn = {
  padding: "11px 22px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "white",
  fontWeight: "600",
  cursor: "pointer",
  fontSize: "14px",
  fontFamily: "'DM Sans', sans-serif",
};

const creditBanner = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "12px 16px",
  borderRadius: "12px",
  background: "#eff6ff",
  border: "1.5px solid #bfdbfe",
  marginBottom: "16px",
  flexWrap: "wrap",
};

export default ClassroomsPage;
