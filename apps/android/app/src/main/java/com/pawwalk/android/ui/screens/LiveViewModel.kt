package com.pawwalk.android.ui.screens

import android.annotation.SuppressLint
import android.app.Application
import android.os.Looper
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.pawwalk.android.BuildConfig
import com.pawwalk.android.data.BookingRepository
import com.pawwalk.android.data.TokenStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import kotlin.math.asin
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * Live GPS tracking client (mirrors the iOS LiveTracker — see
 * docs/FUNCTIONAL-REVIEW.md N7). Streams FusedLocation fixes to the backend over
 * an OkHttp WebSocket and exposes the aggregated track + telemetry.
 */
class LiveViewModel(app: Application) : AndroidViewModel(app) {
    data class Fix(val lat: Double, val lng: Double)
    enum class Phase { CONNECTING, TRACKING, NO_BOOKING, DENIED, FAILED }
    data class State(
        val phase: Phase = Phase.CONNECTING,
        val fixes: List<Fix> = emptyList(),
        val startedAtMs: Long? = null,
    )

    private val _state = MutableStateFlow(State())
    val state: StateFlow<State> = _state.asStateFlow()

    private val json = Json { ignoreUnknownKeys = true }
    private val fused = LocationServices.getFusedLocationProviderClient(app)
    private var socket: WebSocket? = null
    private var activeBookingId: String? = null

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            result.lastLocation?.let { publish(it.latitude, it.longitude) }
        }
    }

    /** Resolve a booking (given or latest) and open the WebSocket. */
    fun connect(bookingId: String?) {
        viewModelScope.launch {
            val id = bookingId ?: runCatching { BookingRepository.fetchBookings() }.getOrNull()
                ?.firstOrNull { it.isActive }?.id
            if (id == null) { _state.update { it.copy(phase = Phase.NO_BOOKING) }; return@launch }
            val token = TokenStore.getToken()
            if (token == null) { _state.update { it.copy(phase = Phase.FAILED) }; return@launch }
            activeBookingId = id
            openSocket(id, token)
        }
    }

    /** Demo: ask the backend to replay a route into this booking's channel so
     *  movement shows up on a stationary emulator. */
    fun simulate() {
        val id = activeBookingId ?: return
        viewModelScope.launch { runCatching { BookingRepository.simulateWalk(id) } }
    }

    private fun openSocket(bookingId: String, token: String) {
        val base = BuildConfig.API_BASE_URL.trimEnd('/')
        val wsBase = base.replaceFirst("https://", "wss://").replaceFirst("http://", "ws://")
        val url = "$wsBase/ws/track/$bookingId?token=$token"
        val request = Request.Builder().url(url).build()
        socket = OkHttpClient().newWebSocket(request, object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) = handleFrame(text)
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                _state.update { if (it.phase == Phase.NO_BOOKING) it else it.copy(phase = Phase.FAILED) }
            }
        })
    }

    private fun handleFrame(text: String) {
        val obj = runCatching { json.parseToJsonElement(text).jsonObject }.getOrNull() ?: return
        when (obj["type"]?.jsonPrimitive?.content) {
            "history" -> {
                val pts = obj["points"]?.jsonArray.orEmpty().mapNotNull { el ->
                    val o = el.jsonObject
                    val lat = o["lat"]?.jsonPrimitive?.content?.toDoubleOrNull()
                    val lng = o["lng"]?.jsonPrimitive?.content?.toDoubleOrNull()
                    if (lat != null && lng != null) Fix(lat, lng) else null
                }
                _state.update { it.copy(phase = Phase.TRACKING, fixes = pts, startedAtMs = it.startedAtMs ?: nowIfAny(pts)) }
            }
            "position" -> {
                val lat = obj["lat"]?.jsonPrimitive?.content?.toDoubleOrNull()
                val lng = obj["lng"]?.jsonPrimitive?.content?.toDoubleOrNull()
                if (lat != null && lng != null) {
                    _state.update {
                        it.copy(phase = Phase.TRACKING, fixes = it.fixes + Fix(lat, lng),
                                startedAtMs = it.startedAtMs ?: System.currentTimeMillis())
                    }
                }
            }
        }
    }

    private fun nowIfAny(pts: List<Fix>): Long? = if (pts.isEmpty()) null else System.currentTimeMillis()

    private fun publish(lat: Double, lng: Double) {
        socket?.send("""{"type":"position","lat":$lat,"lng":$lng}""")
    }

    /** Call after the location permission is granted. */
    @SuppressLint("MissingPermission")
    fun startLocationUpdates() {
        val req = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 3000L)
            .setMinUpdateDistanceMeters(5f).build()
        try {
            fused.requestLocationUpdates(req, locationCallback, Looper.getMainLooper())
        } catch (e: SecurityException) {
            _state.update { it.copy(phase = Phase.DENIED) }
        }
    }

    fun onPermissionDenied() {
        _state.update { it.copy(phase = Phase.DENIED) }
    }

    override fun onCleared() {
        socket?.close(1000, "closed")
        fused.removeLocationUpdates(locationCallback)
    }

    companion object {
        fun distanceMeters(fixes: List<Fix>): Double {
            if (fixes.size < 2) return 0.0
            var total = 0.0
            for (i in 1 until fixes.size) total += haversine(fixes[i - 1], fixes[i])
            return total
        }

        private fun haversine(a: Fix, b: Fix): Double {
            val r = 6_371_000.0
            val dLat = Math.toRadians(b.lat - a.lat)
            val dLng = Math.toRadians(b.lng - a.lng)
            val la = Math.toRadians(a.lat); val lb = Math.toRadians(b.lat)
            val h = sin(dLat / 2) * sin(dLat / 2) + sin(dLng / 2) * sin(dLng / 2) * cos(la) * cos(lb)
            return 2 * r * asin(min(1.0, sqrt(h)))
        }
    }
}
