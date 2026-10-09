let renovacionEnCurso = null
export async function renovarToken() {
    const refresh = localStorage.getItem('refresh')

    if (!refresh) {
        return null
    }

    const respuesta = await fetch(
        'http://localhost:8001/auth/token/refresh/',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh })
        }
    )

    if (
        respuesta.status === 400
        || respuesta.status === 401
    ) {
        return null
    }

    if (!respuesta.ok) {
        throw new Error(
            `Error al renovar la sesión: ${respuesta.status}`
        )
    }

    const data = await respuesta.json()

    if (
        typeof data.access !== 'string'
        || !data.access
    ) {
        throw new Error('La respuesta no contiene un token de acceso')
    }

    localStorage.setItem('token', data.access)

    if (data.refresh) {
        localStorage.setItem('refresh', data.refresh)
    }

    return data.access
}

function cerrarSesion() {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh')
    window.location.assign('/login')

    throw new Error('La sesión venció. Iniciá sesión nuevamente.')
}

export async function apiFetch(url, options = {}) {
    async function hacerPedido(token) {
        const headers = new Headers(options.headers)

        if (token) {
            headers.set('Authorization', `Bearer ${token}`)
        } else {
            headers.delete('Authorization')
        }

        return fetch(url, {
            ...options,
            headers
        })
    }

    const tokenUsado = localStorage.getItem('token')
    const respuesta = await hacerPedido(tokenUsado)

    if (respuesta.status !== 401) {
        return respuesta
    }

    let tokenActual = localStorage.getItem('token')

    if (!tokenActual || tokenActual === tokenUsado) {
        if (!renovacionEnCurso) {
            renovacionEnCurso = renovarToken().finally(() => {
                renovacionEnCurso = null
            })
        }

        tokenActual = await renovacionEnCurso
    }

    if (!tokenActual) {
        cerrarSesion()
    }

    const segundoIntento = await hacerPedido(tokenActual)

    if (segundoIntento.status === 401) {
        cerrarSesion()
    }

    return segundoIntento
}