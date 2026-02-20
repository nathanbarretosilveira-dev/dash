const BarList = ({ title, data, color }) => {
  const max = Math.max(...data.map(i => i.valor), 1);

  return (
    <div className="card">
      <h3>{title}</h3>

      {data.map((item, index) => (
        <div key={index} className="bar-row">
          <span className="label">{item.nome}</span>

          <div className="bar-bg">
            <div
              className="bar-fill"
              style={{
                width: `${(item.valor / max) * 100}%`,
                background: color
              }}
            >
              {item.valor}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BarList;
