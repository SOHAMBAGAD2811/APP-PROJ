export default function SkeletonLoader() {
  const rows = Array.from({ length: 8 });
  
  return (
    <div className="glass anim-fade-in" style={{ padding: '24px', marginTop: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: '8px' }} />
        <div className="skeleton" style={{ width: '120px', height: '36px', borderRadius: '8px' }} />
        <div className="skeleton" style={{ width: '110px', height: '36px', borderRadius: '8px' }} />
      </div>

      <div className="table-wrap">
        <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
          <thead>
            <tr>
              <th style={{ width: '110px' }}><div className="skeleton" style={{ width: '70px', height: '16px' }} /></th>
              <th style={{ width: '80px' }}><div className="skeleton" style={{ width: '50px', height: '16px' }} /></th>
              <th style={{ width: '105px' }}><div className="skeleton" style={{ width: '80px', height: '16px' }} /></th>
              <th style={{ width: '60px' }}><div className="skeleton" style={{ width: '40px', height: '16px' }} /></th>
              <th style={{ width: '60px' }}><div className="skeleton" style={{ width: '40px', height: '16px' }} /></th>
              <th style={{ width: '70px' }}><div className="skeleton" style={{ width: '50px', height: '16px' }} /></th>
              <th style={{ width: '70px' }}><div className="skeleton" style={{ width: '50px', height: '16px' }} /></th>
              <th style={{ width: '100px' }}><div className="skeleton" style={{ width: '70px', height: '16px' }} /></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((_, i) => (
              <tr key={i}>
                <td><div className="skeleton" style={{ width: '80%', height: '20px', borderRadius: '4px' }} /></td>
                <td><div className="skeleton" style={{ width: '60%', height: '20px', borderRadius: '4px' }} /></td>
                <td><div className="skeleton" style={{ width: '90%', height: '20px', borderRadius: '4px' }} /></td>
                <td><div className="skeleton" style={{ width: '70%', height: '20px', borderRadius: '4px' }} /></td>
                <td><div className="skeleton" style={{ width: '70%', height: '20px', borderRadius: '4px' }} /></td>
                <td><div className="skeleton" style={{ width: '80%', height: '20px', borderRadius: '4px' }} /></td>
                <td><div className="skeleton" style={{ width: '90%', height: '20px', borderRadius: '4px' }} /></td>
                <td><div className="skeleton" style={{ width: '70%', height: '20px', borderRadius: '4px' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
