
interface ScryfallCard {
  name: string
  id: string
  released_at: string
  scryfall_uri: string
  mana_cost: string | null
  type_line: string
  colors: string[] | null
  color_identity: string[] | null
  foil: boolean
  nonfoil: boolean
  set: string
  set_name: string
  set_type: string
  set_uri: string
  set_search_uri: string
  scryfall_set_uri: string
  rarity: string
  prices: Record<string, string | null>
  related_uris: Record<string, string>
  quality_score:number
  image_uris?: {
    small?: string
    normal?: string
    large?: string
  }
  // Double-faced / modal / transform cards don't carry a top-level
  // image_uris - each face has its own instead. We fall back to the
  // front face's image so these cards aren't stored without an image.
  card_faces?: {
    image_uris?: {
      small?: string
      normal?: string
      large?: string
    }
  }[]
}
export default ScryfallCard;