export function getGeometry(formula:string):string {
  return ({ CO2:'Linear (180°)', H2O:'Bent (104.5°)', NH3:'Trigonal pyramidal (107°)', CH4:'Tetrahedral (109.5°)', SO2:'Bent', SO3:'Trigonal planar', N2:'Linear', O2:'Linear', H2:'Linear' } as Record<string,string>)[formula] ?? 'Geometry not available for this educational model';
}
