// Fonte única do "jeito de se mover" do app.
// Todas as animações novas usam estes valores, para nada ficar exagerado.

// Molas (spring): quanto maior a rigidez, mais rápido; quanto maior o amortecimento, menos balança
export const SPRING = {
    snappy: { stiffness: 260, damping: 22, mass: 1 }, // trocas rápidas (pílula, abas)
    soft: { stiffness: 140, damping: 18, mass: 1 }, // entradas e saídas (barra, menus)
    pop: { stiffness: 300, damping: 14, mass: 1 }, // pequeno "pulinho" ao ativar algo
  };
  
  // Durações em milissegundos, para animações sem mola
  export const DURATION = {
    fast: 150,
    normal: 250,
    slow: 400,
  };