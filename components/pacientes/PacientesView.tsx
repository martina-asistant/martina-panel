                          {p.alerta_urgencia && (
                            <AlertTriangle className="ml-2 inline h-4 w-4 text-amber-300" />
                          )}
                        </span>

                        <span className="whitespace-nowrap text-xs tabular-nums text-white/55">
                          {p.telefono || 'Sin teléfono'}
                        </span>

                        <span className="whitespace-nowrap text-xs text-cyan-200/70">
                          Próx. cita {mostrarFechaListado(p.proxima_cita_fecha)}
                          {p.proxima_cita_motivo
                            ? ` ${p.proxima_cita_motivo}`
                            : ''}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* FICHA ESCRITORIO */}

            {ficha}
          </div>
        </div>

        {/* Scroll exclusivo de escritorio: fino, cian oscuro. */}
        <style>{`
          .pacientes-scroll-escritorio {
            scrollbar-width: thin;
            scrollbar-color: #176477 #061c25;
          }
          .pacientes-scroll-escritorio::-webkit-scrollbar {
            width: 7px;
            height: 7px;
          }
          .pacientes-scroll-escritorio::-webkit-scrollbar-track {
            background: #061c25;
            border-radius: 999px;
          }
          .pacientes-scroll-escritorio::-webkit-scrollbar-thumb {
            background: #176477;
            border-radius: 999px;
          }
          .pacientes-scroll-escritorio::-webkit-scrollbar-thumb:hover {
            background: #218094;
          }
        `}</style>

        {/* ====================================================== */}
        {/* 6. VERSIÓN MÓVIL                                   */}
        {/* Una pantalla a la vez, menos de 768 px               */}
        {/* Nombre completo + teléfono en la misma fila         */}
        {/* Flecha cian para acceder y regresar                  */}
        {/* ====================================================== */}

        <div className="md:hidden">
          {vistaMovil === 'listado' ? (
            <div className="min-w-0 overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#03111A]/90">
              {errorVisible}

              {buscador}

              {/* LISTADO MÓVIL */}

              <div className="max-h-[640px] overflow-y-auto overflow-x-hidden p-2">
                {cargando ? (
                  <p className="py-10 text-center text-sm text-white/35">
                    Cargando pacientes...
                  </p>
                ) : filtrados.length === 0 ? (
                  <p className="py-10 text-center text-sm text-white/35">
                    No hay pacientes coincidentes
                  </p>
                ) : (
                  filtrados.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => elegir(p)}
                      className="mb-1 w-full min-w-0 rounded-2xl border border-transparent px-3 py-3 text-left hover:border-cyan-400/30 hover:bg-cyan-500/10"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="min-w-0 flex-1 break-words text-sm font-medium">
                          {nombreVisible(p)}
                        </span>

                        <span className="shrink-0 whitespace-nowrap text-[11px] tabular-nums text-white/60">
                          {p.telefono || 'Sin teléfono'}
                        </span>

                        {p.alerta_urgencia && (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                        )}

                        <ChevronRight className="h-4 w-4 shrink-0 text-cyan-300" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* FICHA MÓVIL */

            <div className="min-w-0">
              <button
                type="button"
                onClick={volverListadoMovil}
                disabled={guardando}
                className="mb-3 inline-flex items-center gap-2 rounded-xl px-1 py-2 text-sm font-medium text-cyan-300 disabled:opacity-50"
              >
                <ArrowLeft className="h-5 w-5" />
                Volver a pacientes
              </button>

              {errorVisible}

              {ficha}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
