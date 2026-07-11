import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { buildIcon, HAZARD_META } from './hazardMeta.js';

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}
ClickHandler.propTypes = { onPick: PropTypes.func.isRequired };

function timeAgo(ts) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs}h` : `${Math.round(hrs / 24)}d`;
}

/**
 * Leaflet map with color-coded, recency-faded hazard markers.
 * @param {Object} props
 * @param {import('../../types/index.js').HazardReport[]} props.reports
 * @param {[number,number]} props.center
 * @param {{lat:number,lng:number}|null} props.pinned
 * @param {(latlng:{lat:number,lng:number})=>void} props.onPick
 */
export default function HazardMap({ reports, center, pinned, onPick }) {
  const { t } = useTranslation();
  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      className="h-[420px] w-full rounded-2xl"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />

      {pinned && (
        <Marker
          position={[pinned.lat, pinned.lng]}
          icon={buildIcon('other', Date.now())}
        >
          <Popup>New report location</Popup>
        </Marker>
      )}

      {reports.map((r) => (
        <Marker key={r.id} position={[r.lat, r.lng]} icon={buildIcon(r.type, r.createdAt)}>
          <Popup>
            <div className="space-y-1">
              <div className="flex items-center gap-1 font-bold">
                {HAZARD_META[r.type]?.emoji} {t(`community.${r.type}`)}
              </div>
              {r.note && <p className="text-sm">{r.note}</p>}
              {r.photo && <img src={r.photo} alt="" className="max-h-24 rounded" />}
              <p className="text-xs text-gray-500">{t('community.reportedAgo', { time: timeAgo(r.createdAt) })}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

HazardMap.propTypes = {
  reports: PropTypes.array.isRequired,
  center: PropTypes.array.isRequired,
  pinned: PropTypes.object,
  onPick: PropTypes.func.isRequired,
};
