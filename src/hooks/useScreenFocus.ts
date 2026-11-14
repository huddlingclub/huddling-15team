import { useEffect, useRef } from 'react'

/** 화면이 바뀔 때 제목으로 포커스를 옮겨 스크린리더·키보드 사용자가 새 화면 시작점을 알게 한다. */
export function useScreenFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [])
  return ref
}
