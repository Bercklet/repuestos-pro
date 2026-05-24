// src/modules/ModuloPedidos.jsx
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePedidos, useComentariosPedido } from '../hooks/useData';
import { fmtCOP, fmtNumPedido, tiempoRelativo } from '../lib/supabase';
import { sugerirMarcasCompleto, sugerirModelosCompleto, sugerirComponentes, claveAgrupacion } from '../lib/marcas';
import ModalNuevoPedido from '../components/ModalNuevoPedido';

const ESTADOS = {
  pendiente:   { label:'Pendiente',   bg:'#fef3c7', color:'#d97706', dot:'#d97706' },
  pedido:      { label:'Pedido',      bg:'#dbeafe', color:'#2563eb', dot:'#2563eb' },
  entregado:   { label:'Entregado',   bg:'#dcfce7', color:'#15803d', dot:'#15803d' },
  devuelto:    { label:'Devuelto',    bg:'#fee2e2', color:'#dc2626', dot:'#dc2626' },
  no_consigue: { label:'No consigue', bg:'#f4f3f0', color:'#9c9a92', dot:'#9c9a92' },
};

const PRIORIDADES = {
  urgente: { label:'Urgente', bg:'#fee2e2', color:'#dc2626' },
  alta:    { label:'Alta',    bg:'#fef3c7', color:'#d97706' },
  normal:  { label:'Normal',  bg:'#f4f3f0', color:'#9c9a92' },
};

// ── EXPORT EXCEL ──────────────────────────────────────────────
function exportarExcel(pedidos) {
  const fmtF = f => f ? new Date(f).toLocaleString('es-CO',{dateStyle:'short',timeStyle:'short'}) : '';
  const EL   = {pendiente:'Pendiente',pedido:'Pedido',entregado:'Entregado',devuelto:'Devuelto',no_consigue:'No consigue'};
  const hdrs = ['ID','Repuesto','Marca','Modelo','Tipo','Técnico','Prioridad','Estado','Cantidad','Valor Unitario','Total','Observaciones','Fecha'];
  const rows = pedidos.map(p => [
    fmtNumPedido(p.numero),
    `"${(p.repuesto||'').replace(/"/g,'""')}"`,
    `"${(p.marca||'').replace(/"/g,'""')}"`,
    `"${(p.modelo||'').replace(/"/g,'""')}"`,
    p.tipo||'',
    `"${(p.tecnico?.nombre||'').replace(/"/g,'""')}"`,
    p.prioridad||'',
    EL[p.estado]||p.estado,
    p.cantidad||0,
    p.unitario||0,
    p.estado==='entregado'?(p.unitario||0)*(p.cantidad||0):0,
    `"${(p.observaciones||'').replace(/"/g,'""')}"`,
    fmtF(p.created_at),
  ].join(','));
  const totEnt = pedidos.filter(p=>p.estado==='entregado').reduce((a,p)=>a+(p.unitario||0)*(p.cantidad||0),0);
  const totDev = pedidos.filter(p=>p.estado==='devuelto').reduce((a,p)=>a+(p.unitario||0)*(p.cantidad||0),0);
  rows.push('');
  rows.push(`"","","","","","","","TOTAL ENTREGADO","","",${totEnt},"",""`);
  rows.push(`"","","","","","","","DEVUELTO","","",${totDev},"",""`);
  rows.push(`"","","","","","","","NETO","","",${totEnt-totDev},"",""`);
  const csv  = '\uFEFF' + [hdrs.join(','),...rows].join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `pedidos_repuestospro_${new Date().toLocaleDateString('es-CO').replace(/\//g,'-')}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── BADGE ─────────────────────────────────────────────────────
function Badge({ cfg }) {
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'2px 9px',borderRadius:99,fontSize:11.5,fontWeight:600,background:cfg.bg,color:cfg.color,whiteSpace:'nowrap'}}>
      {cfg.dot && <span style={{width:5,height:5,borderRadius:'50%',background:cfg.dot,flexShrink:0}}/>}
      {cfg.label}
    </span>
  );
}

// ── ESTADO SELECTOR ───────────────────────────────────────────
function EstadoSelector({ current, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const cfg = ESTADOS[current] || ESTADOS.pendiente;
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div ref={ref} style={{position:'relative'}}>
      <div onClick={e=>{if(disabled)return;e.stopPropagation();setOpen(!open);}}
        style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 9px',borderRadius:99,fontSize:11.5,fontWeight:600,background:cfg.bg,color:cfg.color,cursor:disabled?'default':'pointer',userSelect:'none'}}>
        <span style={{width:5,height:5,borderRadius:'50%',background:cfg.dot}}/>
        {cfg.label}
        {!disabled && <span style={{fontSize:10,marginLeft:2}}>▾</span>}
      </div>
      {open && (
        <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,background:'#fff',border:'1px solid #e2dfd8',borderRadius:10,overflow:'hidden',zIndex:100,minWidth:160,boxShadow:'0 8px 24px rgba(0,0,0,.1)'}}>
          {Object.entries(ESTADOS).map(([key,val])=>(
            <div key={key} onClick={e=>{e.stopPropagation();onChange(key);setOpen(false);}}
              style={{display:'flex',alignItems:'center',gap:8,padding:'9px 12px',cursor:'pointer',background:current===key?'#f0eee9':'#fff',fontSize:13,fontWeight:current===key?600:400}}
              onMouseEnter={e=>e.currentTarget.style.background='#f7f6f3'}
              onMouseLeave={e=>e.currentTarget.style.background=current===key?'#f0eee9':'#fff'}>
              <span style={{width:7,height:7,borderRadius:'50%',background:val.dot,flexShrink:0}}/>
              {val.label}
              {current===key && <span style={{marginLeft:'auto',fontSize:12}}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── DETALLE PEDIDO ────────────────────────────────────────────
function DetallePedido({ pedido, onClose, onUpdate, onCambiarEstado, puedeEditar }) {
  const { perfil }                               = useAuth();
  const { comentarios, agregarComentario }       = useComentariosPedido(pedido.id);
  const [precio, setPrecio]                      = useState(pedido.unitario||0);
  const [estado, setEstado]                      = useState(pedido.estado);
  const [nuevoComent, setNuevo]                  = useState('');
  const [guardando, setGuardando]                = useState(false);
  const [error, setError]                        = useState('');

  const guardar = async () => {
    setGuardando(true); setError('');
    try { await onUpdate(pedido.id,{unitario:Number(precio),estado}); }
    catch(e) { setError(e.message); }
    finally { setGuardando(false); }
  };

  const enviarComent = async () => {
    if (!nuevoComent.trim()) return;
    try { await agregarComentario(nuevoComent.trim(),perfil.id); setNuevo(''); }
    catch(e) { setError(e.message); }
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:200,display:'flex',alignItems:'flex-start',justifyContent:'flex-end'}} onClick={onClose}>
      <div style={{background:'#fff',width:460,maxWidth:'95vw',height:'100vh',overflowY:'auto',boxShadow:'-8px 0 32px rgba(0,0,0,.12)'}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:'20px 24px',borderBottom:'1px solid #e2dfd8',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:16,fontWeight:700}}>{fmtNumPedido(pedido.numero)} — {pedido.repuesto}</div>
            <div style={{fontSize:12,color:'#9c9a92',marginTop:2}}>{pedido.marca} {pedido.modelo} · {tiempoRelativo(pedido.created_at)}</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#9c9a92'}}>×</button>
        </div>
        <div style={{padding:24,display:'flex',flexDirection:'column',gap:20}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {[
              {label:'Técnico',    val: pedido.tecnico?.nombre||'—'},
              {label:'Prioridad',  val: <Badge cfg={PRIORIDADES[pedido.prioridad]||PRIORIDADES.normal}/>},
              {label:'Marca',      val: pedido.marca||'—'},
              {label:'Modelo',     val: pedido.modelo||'—'},
              {label:'Tipo',       val: pedido.tipo||'—'},
              {label:'Cantidad',   val: pedido.cantidad},
              {label:'Fecha/Hora', val: new Date(pedido.created_at).toLocaleString('es-CO',{dateStyle:'medium',timeStyle:'medium'})},
              {label:'Estado',     val: <Badge cfg={ESTADOS[pedido.estado]||ESTADOS.pendiente}/>},
            ].map(({label,val})=>(
              <div key={label} style={{background:'#f7f6f3',borderRadius:9,padding:'10px 12px'}}>
                <div style={{fontSize:11,color:'#9c9a92',fontWeight:600,marginBottom:3}}>{label}</div>
                <div style={{fontSize:13,fontWeight:500}}>{val}</div>
              </div>
            ))}
          </div>
          {pedido.observaciones && (
            <div style={{background:'#fef3c7',border:'1px solid #fde68a',borderRadius:9,padding:'10px 12px'}}>
              <div style={{fontSize:11,color:'#d97706',fontWeight:600,marginBottom:3}}>OBSERVACIONES</div>
              <div style={{fontSize:13}}>{pedido.observaciones}</div>
            </div>
          )}
          {puedeEditar && (
            <div style={{background:'#f7f6f3',borderRadius:10,padding:16}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>✏️ Gestión de suministro</div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,color:'#6b6860',fontWeight:600}}>ESTADO</label>
                <div style={{marginTop:6}}><EstadoSelector current={estado} onChange={setEstado}/></div>
              </div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,color:'#6b6860',fontWeight:600}}>VALOR UNITARIO</label>
                <input type="number" value={precio} onChange={e=>setPrecio(e.target.value)}
                  style={{width:'100%',border:'1.5px solid #e2dfd8',borderRadius:8,padding:'7px 10px',fontSize:13,fontFamily:'inherit',outline:'none',marginTop:4,boxSizing:'border-box'}}/>
              </div>
              {error && <div style={{fontSize:12,color:'#dc2626',marginBottom:8}}>⚠ {error}</div>}
              <button onClick={guardar} disabled={guardando}
                style={{width:'100%',padding:'9px',background:'#1a1916',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:600,fontFamily:'inherit',cursor:'pointer'}}>
                {guardando?'Guardando…':'Guardar cambios'}
              </button>
            </div>
          )}
          <div>
            <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>💬 Comentarios ({comentarios.length})</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:200,overflowY:'auto',marginBottom:10}}>
              {comentarios.length===0
                ? <div style={{fontSize:13,color:'#9c9a92',textAlign:'center',padding:'16px 0'}}>Sin comentarios aún</div>
                : comentarios.map(c=>(
                  <div key={c.id} style={{background:'#f7f6f3',borderRadius:8,padding:'8px 12px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:600}}>{c.autor?.nombre||'—'}</span>
                      <span style={{fontSize:11,color:'#9c9a92'}}>{tiempoRelativo(c.created_at)}</span>
                    </div>
                    <div style={{fontSize:13}}>{c.texto}</div>
                  </div>
                ))
              }
            </div>
            <div style={{display:'flex',gap:8}}>
              <input value={nuevoComent} onChange={e=>setNuevo(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&enviarComent()}
                placeholder="Escribe un comentario…"
                style={{flex:1,border:'1.5px solid #e2dfd8',borderRadius:8,padding:'7px 10px',fontSize:13,fontFamily:'inherit',outline:'none'}}/>
              <button onClick={enviarComent}
                style={{padding:'7px 12px',background:'#1a1916',color:'#fff',border:'none',borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>→</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MÓDULO PRINCIPAL ──────────────────────────────────────────
export default function ModuloPedidos() {
  const { esSuministro }                                          = useAuth();
  const { pedidos, loading, error, crearPedido, actualizarPedido, actualizarEstado } = usePedidos();
  const [search, setSearch]                                       = useState('');
  const [filtroEstado, setFiltroEstado]                           = useState('todos');
  const [filtroPrio, setFiltroPrio]                               = useState('todas');
  const [filtroTecnico, setFiltroTecnico]                         = useState('todos');
  const [selected, setSelected]                                   = useState(null);
  const [sortField, setSortField]                                 = useState('created_at');
  const [sortDir, setSortDir]                                     = useState('desc');
  const [modalNuevo, setModalNuevo]                               = useState(false);
  const [vista, setVista]                                         = useState('lista'); // 'lista' | 'tecnico' | 'agrupado'

  const tecnicos = useMemo(()=>[...new Set(pedidos.map(p=>p.tecnico?.nombre).filter(Boolean))],[pedidos]);

  const filtered = useMemo(()=>{
    let list = pedidos.filter(p=>{
      const q = search.toLowerCase();
      return (
        (!q || p.repuesto?.toLowerCase().includes(q) || String(p.numero).includes(q) ||
          p.tecnico?.nombre?.toLowerCase().includes(q) || p.marca?.toLowerCase().includes(q) ||
          p.modelo?.toLowerCase().includes(q)) &&
        (filtroEstado==='todos' || p.estado===filtroEstado) &&
        (filtroPrio==='todas'   || p.prioridad===filtroPrio) &&
        (filtroTecnico==='todos' || p.tecnico?.nombre===filtroTecnico)
      );
    });
    return [...list].sort((a,b)=>{
      let va=a[sortField], vb=b[sortField];
      if(sortField==='tecnico'){va=a.tecnico?.nombre||'';vb=b.tecnico?.nombre||'';}
      if(sortField==='total'){
        va=a.estado==='entregado'?(a.unitario||0)*(a.cantidad||0):0;
        vb=b.estado==='entregado'?(b.unitario||0)*(b.cantidad||0):0;
      }
      return (va<vb?-1:va>vb?1:0)*(sortDir==='asc'?1:-1);
    });
  },[pedidos,search,filtroEstado,filtroPrio,filtroTecnico,sortField,sortDir]);

  const totalEntregado = useMemo(()=>filtered.filter(p=>p.estado==='entregado').reduce((a,p)=>a+(p.unitario||0)*(p.cantidad||0),0),[filtered]);
  const totalDevuelto  = useMemo(()=>filtered.filter(p=>p.estado==='devuelto').reduce((a,p)=>a+(p.unitario||0)*(p.cantidad||0),0),[filtered]);

  const handleSort = field => {
    if(sortField===field) setSortDir(d=>d==='asc'?'desc':'asc');
    else { setSortField(field); setSortDir('asc'); }
  };
  const handleCambiarEstado = async(id,estado)=>{ try{await actualizarEstado(id,estado);}catch(e){console.error(e);} };

  const SortIcon = ({field}) => (
    <span style={{fontSize:10,marginLeft:4,color:sortField===field?'#1a1916':'#d3cfc6'}}>
      {sortField===field?(sortDir==='asc'?'▲':'▼'):'↕'}
    </span>
  );

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:400}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:32,height:32,border:'3px solid #e2dfd8',borderTopColor:'#1a1916',borderRadius:'50%',animation:'spin .7s linear infinite',margin:'0 auto 12px'}}/>
        <div style={{fontSize:14,color:'#9c9a92'}}>Cargando pedidos en tiempo real…</div>
      </div>
    </div>
  );

  if(error) return <div style={{padding:24}}><div style={{padding:16,background:'#fff1f1',border:'1px solid #fecaca',borderRadius:12,fontSize:14,color:'#dc2626'}}>⚠️ {error}</div></div>;

  return (
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:'#f7f6f3',minHeight:'100vh'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div style={{padding:24}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{fontSize:20,fontWeight:700,letterSpacing:'-0.4px'}}>Pedidos</div>
            <div style={{fontSize:13,color:'#6b6860',marginTop:3,display:'flex',alignItems:'center',gap:6}}>
              {filtered.length} pedidos · {filtered.filter(p=>p.estado==='pendiente').length} pendientes
              <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,background:'#dcfce7',color:'#15803d',padding:'1px 7px',borderRadius:99,fontWeight:600}}>
                <span style={{width:5,height:5,borderRadius:'50%',background:'#15803d',animation:'pulse 2s infinite'}}/>Tiempo real
              </span>
            </div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <button onClick={()=>exportarExcel(filtered)}
              title={`Exportar ${filtered.length} pedidos`}
              style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,fontSize:13,fontWeight:500,fontFamily:'inherit',background:'transparent',color:'#6b6860',border:'1px solid #e2dfd8',cursor:'pointer'}}
              onMouseEnter={e=>{e.currentTarget.style.background='#f0eee9';e.currentTarget.style.color='#1a1916';}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#6b6860';}}>
              📥 Excel ({filtered.length})
            </button>
            <button onClick={()=>setModalNuevo(true)}
              style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,fontSize:13,fontWeight:600,fontFamily:'inherit',background:'#1a1916',color:'#fff',border:'none',cursor:'pointer'}}>
              + Nuevo pedido
            </button>
          </div>
        </div>

        {/* Métricas */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10,marginBottom:20}}>
          {[
            {label:'TOTAL',      val:filtered.length,                                      icon:'📋',bg:'#dbeafe',c:'#2563eb'},
            {label:'PENDIENTES', val:filtered.filter(p=>p.estado==='pendiente').length,    icon:'⏳',bg:'#fef3c7',c:'#d97706'},
            {label:'PEDIDOS',    val:filtered.filter(p=>p.estado==='pedido').length,       icon:'🛒',bg:'#ede9fe',c:'#7c3aed'},
            {label:'ENTREGADOS', val:filtered.filter(p=>p.estado==='entregado').length,    icon:'📦',bg:'#dcfce7',c:'#15803d'},
            {label:'GASTADO',    val:fmtCOP(totalEntregado),                               icon:'💰',bg:'#dcfce7',c:'#15803d'},
            {label:'DEVUELTO',   val:fmtCOP(totalDevuelto),                                icon:'↩️',bg:'#fee2e2',c:'#dc2626'},
          ].map(m=>(
            <div key={m.label} style={{background:'#fff',border:'1px solid #e2dfd8',borderRadius:12,padding:'12px 14px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontSize:11,fontWeight:700,color:'#9c9a92',letterSpacing:'.3px'}}>{m.label}</span>
                <div style={{width:24,height:24,borderRadius:6,background:m.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>{m.icon}</div>
              </div>
              <div style={{fontSize:19,fontWeight:700,letterSpacing:'-0.5px',fontFamily:'monospace',color:m.c}}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Filtros + selector de vista */}
        <div style={{background:'#fff',border:'1px solid #e2dfd8',borderRadius:12,padding:'14px 16px',marginBottom:16,display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <div style={{position:'relative',flex:1,minWidth:180}}>
            <span style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',fontSize:14,color:'#9c9a92'}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar repuesto, marca, modelo, técnico…"
              style={{width:'100%',background:'#f7f6f3',border:'1px solid #e2dfd8',borderRadius:8,padding:'7px 12px 7px 30px',fontSize:13,fontFamily:'inherit',outline:'none'}}/>
          </div>
          <select value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}
            style={{background:'#f7f6f3',border:'1px solid #e2dfd8',borderRadius:8,padding:'7px 10px',fontSize:13,fontFamily:'inherit',outline:'none',cursor:'pointer'}}>
            <option value="todos">Todos los estados</option>
            {Object.entries(ESTADOS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filtroPrio} onChange={e=>setFiltroPrio(e.target.value)}
            style={{background:'#f7f6f3',border:'1px solid #e2dfd8',borderRadius:8,padding:'7px 10px',fontSize:13,fontFamily:'inherit',outline:'none',cursor:'pointer'}}>
            <option value="todas">Todas las prioridades</option>
            {Object.entries(PRIORIDADES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filtroTecnico} onChange={e=>setFiltroTecnico(e.target.value)}
            style={{background:'#f7f6f3',border:'1px solid #e2dfd8',borderRadius:8,padding:'7px 10px',fontSize:13,fontFamily:'inherit',outline:'none',cursor:'pointer'}}>
            <option value="todos">Todos los técnicos</option>
            {tecnicos.map(t=><option key={t}>{t}</option>)}
          </select>
          {(search||filtroEstado!=='todos'||filtroPrio!=='todas'||filtroTecnico!=='todos') && (
            <button onClick={()=>{setSearch('');setFiltroEstado('todos');setFiltroPrio('todas');setFiltroTecnico('todos');}}
              style={{fontSize:12.5,color:'#dc2626',background:'transparent',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
              × Limpiar
            </button>
          )}

          {/* Selector de vista */}
          <div style={{marginLeft:'auto',display:'flex',gap:4,background:'#f0eee9',borderRadius:8,padding:3}}>
            {[
              {id:'lista',   icon:'☰',  label:'Lista'},
              {id:'tecnico', icon:'👥', label:'Por técnico'},
              {id:'agrupado',icon:'📦', label:'Agrupado'},
            ].map(v=>(
              <button key={v.id} onClick={()=>setVista(v.id)}
                title={v.label}
                style={{padding:'5px 10px',borderRadius:6,border:'none',background:vista===v.id?'#fff':'transparent',fontSize:13,cursor:'pointer',fontFamily:'inherit',fontWeight:vista===v.id?600:400,color:vista===v.id?'#1a1916':'#6b6860',boxShadow:vista===v.id?'0 1px 4px rgba(0,0,0,.08)':'none',transition:'all .15s'}}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── VISTA LISTA ── */}
        {vista==='lista' && (
          <div style={{background:'#fff',border:'1px solid #e2dfd8',borderRadius:14,overflow:'hidden'}}>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',minWidth:760}}>
                <thead>
                  <tr style={{background:'#fafaf9'}}>
                    {[
                      {label:'ID',       field:'numero'},
                      {label:'REPUESTO', field:'repuesto'},
                      {label:'MARCA/MOD',field:'marca'},
                      {label:'TÉCNICO',  field:'tecnico'},
                      {label:'PRIOR.',   field:'prioridad'},
                      {label:'ESTADO',   field:'estado'},
                      {label:'CANT.',    field:'cantidad'},
                      {label:'TOTAL',    field:'total'},
                      {label:'FECHA',    field:'created_at'},
                    ].map(h=>(
                      <th key={h.field} onClick={()=>handleSort(h.field)}
                        style={{fontSize:11,fontWeight:700,color:'#9c9a92',textAlign:'left',padding:'10px 14px',borderBottom:'1px solid #e2dfd8',letterSpacing:'.3px',whiteSpace:'nowrap',cursor:'pointer',userSelect:'none'}}>
                        {h.label}<SortIcon field={h.field}/>
                      </th>
                    ))}
                    <th style={{padding:'10px 14px',borderBottom:'1px solid #e2dfd8'}}/>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length===0?(
                    <tr><td colSpan={10} style={{textAlign:'center',padding:'48px 24px',color:'#9c9a92',fontSize:14}}>
                      <div style={{fontSize:32,marginBottom:10}}>🔍</div>Sin pedidos con los filtros actuales.
                    </td></tr>
                  ):filtered.map(p=>{
                    const esDevuelto   = p.estado==='devuelto';
                    const esNoConsigue = p.estado==='no_consigue';
                    const totalFila    = (p.unitario||0)*(p.cantidad||0);
                    return(
                      <tr key={p.id} onClick={()=>setSelected(p)}
                        style={{cursor:'pointer',borderBottom:'1px solid #f0eee9',background:selected?.id===p.id?'#f7f6f3':'transparent'}}
                        onMouseEnter={e=>{if(selected?.id!==p.id)e.currentTarget.style.background='#fafaf9';}}
                        onMouseLeave={e=>{if(selected?.id!==p.id)e.currentTarget.style.background='transparent';}}>
                        <td style={{padding:'10px 14px'}}><span style={{fontFamily:'monospace',fontSize:11,color:'#9c9a92'}}>{fmtNumPedido(p.numero)}</span></td>
                        <td style={{padding:'10px 14px'}}>
                          <div style={{fontSize:13,fontWeight:500,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.repuesto}</div>
                          <div style={{fontSize:11,color:'#9c9a92'}}>{p.tipo}</div>
                        </td>
                        <td style={{padding:'10px 14px'}}>
                          <div style={{fontSize:12.5,fontWeight:500}}>{p.marca||'—'}</div>
                          <div style={{fontSize:11,color:'#9c9a92'}}>{p.modelo||'—'}</div>
                        </td>
                        <td style={{padding:'10px 14px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <div style={{width:20,height:20,borderRadius:'50%',background:p.tecnico?.color||'#e2dfd8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,color:'#fff',flexShrink:0}}>{p.tecnico?.avatar||'?'}</div>
                            <span style={{fontSize:12.5,color:'#6b6860'}}>{p.tecnico?.nombre||'—'}</span>
                          </div>
                        </td>
                        <td style={{padding:'10px 14px'}}><Badge cfg={PRIORIDADES[p.prioridad]||PRIORIDADES.normal}/></td>
                        <td style={{padding:'10px 14px',zIndex:10}} onClick={e=>e.stopPropagation()}>
                          {esSuministro
                            ?<EstadoSelector current={p.estado} onChange={val=>handleCambiarEstado(p.id,val)}/>
                            :<Badge cfg={ESTADOS[p.estado]||ESTADOS.pendiente}/>
                          }
                        </td>
                        <td style={{padding:'10px 14px',fontSize:13,textAlign:'center',fontFamily:'monospace',fontWeight:600}}>{p.cantidad}</td>
                        <td style={{padding:'10px 14px',fontSize:13,fontFamily:'monospace',fontWeight:700,color:(esDevuelto||esNoConsigue)?'#9c9a92':'#1a1916',textDecoration:(esDevuelto||esNoConsigue)?'line-through':'none'}}>
                          {totalFila?fmtCOP(totalFila):'—'}
                        </td>
                        <td style={{padding:'10px 14px',fontSize:11.5,color:'#9c9a92',whiteSpace:'nowrap'}}>{tiempoRelativo(p.created_at)}</td>
                        <td style={{padding:'10px 14px'}}>
                          <button onClick={e=>{e.stopPropagation();setSelected(p);}}
                            style={{padding:'4px 9px',borderRadius:7,border:'1px solid #e2dfd8',background:'transparent',fontSize:12,fontFamily:'inherit',cursor:'pointer',color:'#6b6860'}}>
                            Ver →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{padding:'10px 16px',borderTop:'1px solid #e2dfd8',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#fafaf9',flexWrap:'wrap',gap:8}}>
              <span style={{fontSize:12.5,color:'#9c9a92'}}>{filtered.length} de {pedidos.length} pedidos</span>
              <span style={{fontSize:12.5,color:'#6b6860',fontFamily:'monospace'}}>
                Entregado: <strong>{fmtCOP(totalEntregado)}</strong>
                {totalDevuelto>0 && <span style={{color:'#dc2626',marginLeft:8}}>↩ −{fmtCOP(totalDevuelto)}</span>}
              </span>
            </div>
          </div>
        )}

        {/* ── VISTA POR TÉCNICO ── */}
        {vista==='tecnico' && <VistaTecnicos pedidos={filtered}/>}

        {/* ── VISTA AGRUPADA ── */}
        {vista==='agrupado' && <VistaAgrupada pedidos={filtered}/>}
      </div>

      {selected && (
        <DetallePedido pedido={selected} onClose={()=>setSelected(null)}
          onUpdate={actualizarPedido} onCambiarEstado={handleCambiarEstado} puedeEditar={esSuministro}/>
      )}
      {modalNuevo && (
        <ModalNuevoPedido onClose={()=>setModalNuevo(false)} onCrear={crearPedido}/>
      )}
    </div>
  );
}
